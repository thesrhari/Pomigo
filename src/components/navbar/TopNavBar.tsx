"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Bell, Menu } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

export const TopNavBar: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false);

  return (
    <div className="border-b px-6 py-4 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNavbarOpen(!navbarOpen)}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </Button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Pomigo</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full"></span>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            AK
          </div>
        </div>
      </div>
    </div>
  );
};
