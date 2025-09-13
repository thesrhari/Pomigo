"use client";
import React from "react";
import { TopNavBar } from "./TopNavBar";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import { Bounce, ToastContainer } from "react-toastify";

interface NavBarProviderProps {
  children: React.ReactNode;
}

const privateRoutes = [
  "/dashboard",
  "/study",
  "/analytics",
  "/friends",
  "/leaderboards",
  "/profile",
  "/customize",
  "/subscription",
];

export default function NavBarProvider({ children }: NavBarProviderProps) {
  const pathname = usePathname();
  const isPrivateRoute = privateRoutes.includes(pathname);

  if (isPrivateRoute) {
    return (
      <div className="min-h-screen transition-colors duration-300">
        <div className="min-h-screen bg-background">
          <TopNavBar />

          <div className="flex">
            <Sidebar />
            <div className="flex-1 lg:ml-64 overflow-auto">
              <div className="p-6 lg:p-8">{children}</div>
            </div>
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              transition={Bounce}
            />
          </div>
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
}
