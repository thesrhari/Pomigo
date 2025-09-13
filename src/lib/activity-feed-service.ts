// lib/activity-feed-service.ts
import { createClient } from "@/lib/supabase/client";
import { format, startOfDay, subHours, subDays } from "date-fns";
import { User } from "@supabase/supabase-js";

const supabase = createClient();

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type:
    | "completed_session"
    | "completed_break"
    | "study_summary"
    | "first_session"
    | "on_a_roll"
    | "streak_milestone";
  message: string;
  metadata: Record<string, any>;
  created_at: string;
  user: {
    display_name: string;
    avatar_url: string;
  };
}

interface SessionData {
  user_id: string;
  session_type: "study" | "short_break" | "long_break";
  duration: number;
  subject?: string | null;
  started_at: string;
}

interface ActivityFeedEntry {
  user_id: string;
  activity_type:
    | "completed_session"
    | "completed_break"
    | "study_summary"
    | "first_session"
    | "on_a_roll"
    | "streak_milestone";
  message: string;
  metadata: Record<string, any>;
}

// Define the shape of the options for fetching the feed
type GetFeedOptions = { limit: number } | { timeframeInHours: number };

export class ActivityFeedService {
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours} hr${mins > 0 ? ` ${mins} min` : ""}`;
    }
    return `${mins} min`;
  }

  // Check and create activity based on session completion
  async processSessionActivity(
    user: User | null | undefined,
    sessionData: SessionData
  ): Promise<void> {
    if (!user) return;

    // Check if user has activity feed enabled
    const { data: profile } = await supabase
      .from("profiles")
      .select("activity_feed_enabled")
      .eq("id", user.id)
      .single();

    if (!profile?.activity_feed_enabled) return;

    const activities: ActivityFeedEntry[] = [];

    if (sessionData.session_type === "study") {
      const studyActivities = await this.checkStudySessionActivities(
        sessionData
      );
      activities.push(...studyActivities);
    } else if (
      sessionData.session_type === "long_break" &&
      sessionData.duration >= 25
    ) {
      const breakActivity = await this.createBreakActivity(sessionData);
      activities.push(breakActivity);
    }

    // Insert all activities
    if (activities.length > 0) {
      const { error } = await supabase.from("activity_feed").insert(activities);
      if (error) console.error("Error inserting activity feed items:", error);
    }
  }

  private async checkStudySessionActivities(
    sessionData: SessionData
  ): Promise<ActivityFeedEntry[]> {
    const activities: ActivityFeedEntry[] = [];
    const today = startOfDay(new Date());
    const threeHoursAgo = subHours(new Date(), 3);

    // Get today's sessions for this user
    const { data: todaySessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", sessionData.user_id)
      .eq("session_type", "study")
      .gte("started_at", today.toISOString());

    if (!todaySessions) return activities;

    // 1. Completed Study Session
    const subject = sessionData.subject || "General Study";
    activities.push({
      user_id: sessionData.user_id,
      activity_type: "completed_session",
      message: `completed a ${sessionData.duration}-minute session in ${subject}.`,
      metadata: {
        duration: sessionData.duration,
        subject,
        session_id: `${sessionData.user_id}-${Date.now()}`,
      },
    });

    // 2. First Session of the Day
    if (todaySessions.length === 1) {
      activities.push({
        user_id: sessionData.user_id,
        activity_type: "first_session",
        message: "started their first study session of the day.",
        metadata: { date: format(today, "yyyy-MM-dd") },
      });
    }

    // 3. On a Roll (5 sessions of 25+ minutes within 3 hours)
    const recentSessions = todaySessions.filter(
      (s) => new Date(s.started_at) >= threeHoursAgo && s.duration >= 25
    );

    if (recentSessions.length >= 5) {
      // Check if we haven't already logged this milestone today
      const { data: existingRoll } = await supabase
        .from("activity_feed")
        .select("id")
        .eq("user_id", sessionData.user_id)
        .eq("activity_type", "on_a_roll")
        .gte("created_at", today.toISOString())
        .limit(1);

      if (!existingRoll?.length) {
        activities.push({
          user_id: sessionData.user_id,
          activity_type: "on_a_roll",
          message: `is on a study mood. Completed ${recentSessions.length} sessions.`,
          metadata: { session_count: recentSessions.length },
        });
      }
    }

    // 4. Study Summary (daily milestones) - Updated to show exact time
    const totalStudyTime = todaySessions.reduce(
      (sum, s) => sum + s.duration,
      0
    );
    const milestones = [120, 240, 360, 480, 600, 720]; // 2, 4, 6, 8, 10, 12 hours in minutes

    for (const milestone of milestones) {
      if (totalStudyTime >= milestone) {
        // Check if we've already logged this milestone today
        const { data: existingSummary } = await supabase
          .from("activity_feed")
          .select("id")
          .eq("user_id", sessionData.user_id)
          .eq("activity_type", "study_summary")
          .eq("metadata->>milestone", milestone.toString())
          .gte("created_at", today.toISOString())
          .limit(1);

        if (!existingSummary?.length) {
          activities.push({
            user_id: sessionData.user_id,
            activity_type: "study_summary",
            message: `studied ${this.formatDuration(totalStudyTime)} today.`,
            metadata: {
              milestone,
              actual_time: totalStudyTime,
              date: format(today, "yyyy-MM-dd"),
            },
          });
          break; // Only log the highest milestone reached
        }
      }
    }

    // 5. Streak Milestone - Updated logic
    if (todaySessions.length === 1) {
      await this.checkStreakMilestone(sessionData.user_id, activities);
    }

    return activities;
  }

  private async createBreakActivity(
    sessionData: SessionData
  ): Promise<ActivityFeedEntry> {
    return {
      user_id: sessionData.user_id,
      activity_type: "completed_break",
      message: `took a ${sessionData.duration}-minute break.`,
      metadata: { duration: sessionData.duration },
    };
  }

  private async checkStreakMilestone(
    userId: string,
    activities: ActivityFeedEntry[]
  ): Promise<void> {
    // Get all study sessions to calculate streak
    const { data: allSessions } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("user_id", userId)
      .eq("session_type", "study")
      .order("started_at", { ascending: false });

    if (!allSessions) return;

    const currentStreak = this.calculateCurrentStreak(allSessions);

    // Only generate streak activity if streak is 3 days or more
    if (currentStreak >= 3) {
      const today = startOfDay(new Date());

      // Check if we've already logged a streak milestone today
      const { data: existingStreak } = await supabase
        .from("activity_feed")
        .select("id")
        .eq("user_id", userId)
        .eq("activity_type", "streak_milestone")
        .gte("created_at", today.toISOString())
        .limit(1);

      if (!existingStreak?.length) {
        activities.push({
          user_id: userId,
          activity_type: "streak_milestone",
          message: `has a study streak of ${currentStreak} days!`,
          metadata: {
            streak_days: currentStreak,
            date: format(today, "yyyy-MM-dd"),
          },
        });
      }
    }
  }

  private calculateCurrentStreak(sessions: { started_at: string }[]): number {
    if (sessions.length === 0) return 0;

    const uniqueDays = [
      ...new Set(
        sessions.map((s) => format(new Date(s.started_at), "yyyy-MM-dd"))
      ),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (uniqueDays.length === 0) return 0;

    let currentStreak = 0;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

    if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 0; i < uniqueDays.length - 1; i++) {
        const day1 = new Date(uniqueDays[i]);
        const day2 = new Date(uniqueDays[i + 1]);
        if (
          format(subDays(day1, 1), "yyyy-MM-dd") === format(day2, "yyyy-MM-dd")
        ) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return currentStreak;
  }

  // Fetch activity feed for user's friends with conditional logic
  async getFriendActivityFeed(
    user: User | null | undefined,
    friendIds: string[],
    options: GetFeedOptions
  ): Promise<ActivityFeedItem[]> {
    if (!user || !friendIds.length) return [];

    if ("limit" in options) {
      const { data: activities, error } = await this.fetchActivities(
        friendIds,
        { limit: options.limit }
      );
      if (error) {
        console.error("Error fetching activity feed:", error);
        return [];
      }
      return this.filterAndFormatActivities(activities);
    }

    if ("timeframeInHours" in options) {
      const fromDate = subHours(
        new Date(),
        options.timeframeInHours
      ).toISOString();

      const { data: recentActivities, error: recentError } =
        await this.fetchActivities(friendIds, { fromDate });

      if (recentError) {
        console.error("Error fetching recent activity feed:", recentError);
        return [];
      }

      if (recentActivities && recentActivities.length >= 20) {
        return this.filterAndFormatActivities(recentActivities);
      }

      const { data: latestActivities, error: latestError } =
        await this.fetchActivities(friendIds, { limit: 20 });

      if (latestError) {
        console.error("Error fetching latest activity feed:", latestError);
        return [];
      }
      return this.filterAndFormatActivities(latestActivities);
    }

    return [];
  }

  // Helper function to build and execute the query
  private async fetchActivities(
    friendIds: string[],
    options: { limit?: number; fromDate?: string }
  ) {
    let query = supabase
      .from("activity_feed")
      .select(
        `
        *,
        user:profiles!activity_feed_user_id_fkey (
          display_name,
          avatar_url,
          activity_feed_enabled
        )
      `
      )
      .in("user_id", friendIds)
      .order("created_at", { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    } else if (options.fromDate) {
      query = query.gte("created_at", options.fromDate);
    }

    return await query;
  }

  // Helper function to process the results
  private filterAndFormatActivities(
    activities: any[] | null
  ): ActivityFeedItem[] {
    if (!activities) return [];

    return activities
      .filter((activity) => activity.user?.activity_feed_enabled)
      .map((activity) => ({
        ...activity,
        user: {
          display_name: activity.user?.display_name || "Unknown",
          avatar_url: activity.user?.avatar_url || "👤",
        },
      }));
  }
}
