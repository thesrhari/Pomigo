"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react"; // Import Loader2
import type { SearchResult } from "@/types/friends";

// --- (AddFriendModalProps interface remains the same, but ensure onSendRequest returns a Promise) ---
interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (username: string) => Promise<SearchResult[]>;
  onSendRequest: (username: string) => Promise<void>; // Make sure this is async
  getButtonState: (result: SearchResult) => {
    text: string;
    disabled: boolean;
    variant: "default" | "secondary" | "destructive";
  };
}

export default function AddFriendModal({
  isOpen,
  onClose,
  onSearch,
  onSendRequest,
  getButtonState,
}: AddFriendModalProps) {
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // State to track the ID of the user whose request is being sent
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await onSearch(searchUsername.replace("@", ""));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for sending a friend request with loading state
  const handleSendRequest = async (user: SearchResult) => {
    if (sendingRequestId) return; // Prevent another request while one is loading

    setSendingRequestId(user.id);
    try {
      await onSendRequest(user.username);
      // The parent component should handle updating the UI,
      // e.g., by re-fetching data which will update the button state via getButtonState
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleClose = () => {
    setSearchUsername("");
    setSearchResults([]);
    setHasSearched(false);
    setSendingRequestId(null); // Reset sending state on close
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friends</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter username (e.g., @username)"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="flex-1 border-border bg-background"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchUsername.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* --- (Rest of the JSX remains similar) --- */}

          {!isSearching && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users found with that username.</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {searchResults.map((user) => {
                const buttonState = getButtonState(user);
                const isSending = sendingRequestId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50"
                  >
                    {/* --- (User info display remains the same) --- */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-card-foreground">
                          {user.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="cursor-pointer hover:bg-primary/80"
                      variant={buttonState.variant}
                      onClick={() => {
                        if (buttonState.text === "Add") {
                          handleSendRequest(user);
                        }
                      }}
                      // Disable if this button is loading OR if the parent says so
                      disabled={isSending || buttonState.disabled}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        buttonState.text
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
