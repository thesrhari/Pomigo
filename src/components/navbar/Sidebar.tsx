"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Timer,
  BarChart3,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { id: "study", label: "Study", icon: Timer, path: "/study" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { id: "friends", label: "Friends", icon: Users, path: "/friends" },
  {
    id: "leaderboards",
    label: "Leaderboards",
    icon: Trophy,
    path: "/leaderboards",
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const supabase = createClient();

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Use internal state if no external state is provided
  const [internalSidebarOpen, setInternalSidebarOpen] =
    useState<boolean>(false);

  const sidebarOpen = isOpen ?? internalSidebarOpen;
  const setSidebarOpen = onClose ? () => onClose() : setInternalSidebarOpen;

  const handleNavigation = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      router.push("/login");
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-40 p-2"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:fixed top-0 left-0 z-30 w-64 h-full bg-background border-r transition-transform duration-300`}
      >
        {/* Add padding from top to account for navbar */}
        <div className="pt-24 lg:pt-24 h-full flex flex-col">
          {/* Main navigation - grows to fill space */}
          <nav className="flex-1 overflow-y-auto px-6">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* Bottom section - stays at bottom */}
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4 space-y-2">
              {/* Profile Button */}
              <Button
                variant={pathname === "/profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("/profile")}
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Button>
              {/* Logout Button */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={signOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};
