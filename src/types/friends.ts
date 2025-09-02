// types/friends.ts

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  updated_at: string;
}

export interface FriendRelationship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile extends FriendRelationship {
  requester: Profile;
  addressee: Profile;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  mutual_friends: number;
  timestamp: string;
  relationship_id: string;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  status?: string;
  is_online?: boolean;
  relationship_id: string;
}

// Add this new type
export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  relationship_id: string;
}

export interface SearchResult {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  mutual_friends: number;
  relationship_status?: "pending" | "accepted" | "blocked" | null;
  is_requester?: boolean;
}

export type FriendSystemError = {
  message: string;
  code?: string;
};
