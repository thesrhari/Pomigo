"use client";
import React from "react";
import { TopNavBar } from "./TopNavBar";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

interface NavBarProviderProps {
  children: React.ReactNode;
}

const publicRoutes = ["/", "/login"];

export default function NavBarProvider({ children }: NavBarProviderProps) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <div>{children}</div>;
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <div className="flex">
          <Sidebar />
          <div className="flex-1 lg:ml-64 overflow-auto">
            <div className="p-6 lg:p-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
