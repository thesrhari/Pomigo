"use client";

import { Timer, Paintbrush } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";

export const TopNavBar: React.FC = () => {
  const { profile, loading } = useProfile();

  return (
    <div className="border-b px-6 py-4 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4 px-8 lg:px-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Pomigo</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme selector button */}
          <Link href="/customize">
            <Button variant="outline" size="sm" className="p-2 cursor-pointer">
              <Paintbrush className="w-4 h-4" /> Customize
              <span className="sr-only">Theme selector</span>
            </Button>
          </Link>

          {/* Profile Dropdown */}
          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer select-none">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile?.username || "User avatar"}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name}
                    </p>
                    <p className="mt-2 text-xs leading-none text-muted-foreground">
                      @{profile?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Edit profile</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};
