import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
interface Task {
  id: number;
  title: string;
  subject: string;
  due: string;
  completed: boolean;
  description?: string;
}

interface Subject {
  id: number;
  name: string;
  color: string;
  icon: string;
  totalHours: number;
}

interface Friend {
  name: string;
  status: string;
  avatar: string;
  streak: number;
  isOnline: boolean;
  hoursToday: number;
}

interface PomodoroSettings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  iterations: number;
}

interface AppState {
  // UI State
  sidebarOpen: boolean;

  // Timer State
  timerRunning: boolean;
  timeLeft: number;
  currentSubject: string;

  // Data State
  subjects: Subject[];
  tasks: Task[];
  pomodoroSettings: PomodoroSettings;

  // Actions
  setSidebarOpen: (open: boolean) => void;

  // Timer Actions
  setTimerRunning: (running: boolean) => void;
  setTimeLeft: (time: number) => void;
  setCurrentSubject: (subject: string) => void;

  // Data Actions
  updateSubjects: (subjects: Subject[]) => void;
  updateTasks: (tasks: Task[]) => void;
  updatePomodoroSettings: (settings: PomodoroSettings) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial UI State
      sidebarOpen: false,

      // Initial Timer State
      timerRunning: false,
      timeLeft: 25 * 60,
      currentSubject: "Mathematics",

      // Initial Data
      subjects: [
        {
          id: 1,
          name: "Mathematics",
          color: "#3B82F6",
          icon: "📐",
          totalHours: 15.2,
        },
        {
          id: 2,
          name: "Physics",
          color: "#10B981",
          icon: "🔬",
          totalHours: 10.8,
        },
        {
          id: 3,
          name: "Chemistry",
          color: "#F59E0B",
          icon: "🧪",
          totalHours: 8.6,
        },
        {
          id: 4,
          name: "Biology",
          color: "#EF4444",
          icon: "🧬",
          totalHours: 8.6,
        },
      ],

      tasks: [
        {
          id: 1,
          title: "Complete Calculus Assignment",
          subject: "Mathematics",
          due: "Today",
          completed: false,
          description: "Chapter 5 problems 1-20",
        },
        {
          id: 2,
          title: "Read Chapter 5 - Thermodynamics",
          subject: "Physics",
          due: "Tomorrow",
          completed: false,
          description: "Focus on heat transfer concepts",
        },
        {
          id: 3,
          title: "Lab Report - Organic Synthesis",
          subject: "Chemistry",
          due: "2 days",
          completed: true,
          description: "Write up results from last week's lab",
        },
        {
          id: 4,
          title: "Study for Midterm Exam",
          subject: "Biology",
          due: "1 week",
          completed: false,
          description: "Chapters 8-12, focus on cellular processes",
        },
      ],

      pomodoroSettings: {
        focusTime: 25,
        shortBreak: 5,
        longBreak: 15,
        iterations: 4,
      },

      // UI Actions
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      // Timer Actions
      setTimerRunning: (timerRunning) => set({ timerRunning }),
      setTimeLeft: (timeLeft) => set({ timeLeft }),
      setCurrentSubject: (currentSubject) => set({ currentSubject }),

      // Data Actions
      updateSubjects: (subjects) => set({ subjects }),
      updateTasks: (tasks) => set({ tasks }),
      updatePomodoroSettings: (pomodoroSettings) => set({ pomodoroSettings }),
    }),
    {
      name: "pomigo-storage",
      partialize: (state) => ({
        subjects: state.subjects,
        tasks: state.tasks,
        pomodoroSettings: state.pomodoroSettings,
      }),
    }
  )
);
