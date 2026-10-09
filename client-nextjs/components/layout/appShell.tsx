"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Sidebar from "./sidebar";
import Navbar from "./navbar";
import SessionKeepAlive from "./SessionKeepAlive";
import { prefetchAdminDashboardLists } from "@/lib/prefetch-dashboard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = String(user?.role || "").toLowerCase();
      if (role === "admin") {
        prefetchAdminDashboardLists(queryClient);
      }
    } catch {
      /* ignore */
    }
  }, [queryClient]);

  return (
    <div className="flex h-screen bg-background">
      <SessionKeepAlive />
      {/* SIDEBAR */}
      <Sidebar />
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[290px] max-w-[85vw] gap-0 p-0 md:hidden"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Dashboard navigation menu</SheetDescription>
          </SheetHeader>
          <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* RIGHT SECTION */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP NAVBAR */}
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
