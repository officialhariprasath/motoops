"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Bell, Menu } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  GARAGE_NOTIFICATIONS_EVENT,
  getNotifications,
  markNotificationsRead,
  type GarageNotification,
} from "@/lib/notifications";

const logoutUser = async () => {
  const res = await fetch("/api/logout", {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
};

function getPageTitle(pathname: string) {
  if (/^\/dashboard\/admin\/services\/[^/]+\/estimate$/.test(pathname)) {
    return "Estimate";
  }
  if (/^\/dashboard\/admin\/services\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Job Card";
  }
  if (pathname === "/dashboard/admin/services/create") {
    return "Create Job Card";
  }
  if (/^\/dashboard\/admin\/services\/[^/]+$/.test(pathname)) {
    return "Job Card Details";
  }
  if (
    pathname === "/dashboard/admin/services" ||
    pathname.startsWith("/dashboard/admin/services/")
  ) {
    return "Job Cards";
  }
  if (/^\/dashboard\/admin\/users\/[^/]+$/.test(pathname)) {
    return "Customer Vehicles";
  }
  if (/^\/dashboard\/admin\/vehicles\/[^/]+$/.test(pathname)) {
    return "Vehicle Job Cards";
  }

  const routes: Array<{ prefix: string; title: string }> = [
    { prefix: "/dashboard/admin/items", title: "Items" },
    { prefix: "/dashboard/admin/users", title: "Users" },
    { prefix: "/dashboard/admin/vehicles", title: "Vehicles" },
    { prefix: "/dashboard/admin/invoices", title: "Invoices" },
    { prefix: "/dashboard/admin/workforce", title: "Workforce" },
    { prefix: "/dashboard/admin/permissions", title: "Permissions" },
    { prefix: "/dashboard/reports", title: "Reports" },
    { prefix: "/dashboard/settings", title: "Settings" },
    { prefix: "/dashboard/Profile", title: "Profile" },
    { prefix: "/dashboard/mechanic/services", title: "Assigned Services" },
    { prefix: "/dashboard/mechanic", title: "Mechanic Dashboard" },
    { prefix: "/dashboard/user/my-vehicles", title: "My Vehicles" },
    { prefix: "/dashboard/user/my-services", title: "My Services" },
    { prefix: "/dashboard/user/my-invoices", title: "My Invoices" },
    { prefix: "/dashboard/user", title: "Customer Dashboard" },
    { prefix: "/dashboard", title: "Dashboard" },
  ];

  for (const route of routes) {
    if (pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)) {
      return route.title;
    }
  }

  return "Dashboard";
}

type NavbarProps = {
  onMenuClick?: () => void;
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname || "/dashboard");
  const [role, setRole] = useState("");
  const [initials, setInitials] = useState("U");
  const [notifications, setNotifications] = useState<GarageNotification[]>([]);

  useEffect(() => {
    const sync = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(user.role || "");
      const name = String(user.name || user.username || "User");
      setInitials(
        name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0]?.toUpperCase())
          .join("") || "U"
      );
      setNotifications(getNotifications(user.role));
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(GARAGE_NOTIFICATIONS_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(GARAGE_NOTIFICATIONS_EVENT, sync);
    };
  }, []);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    },
  });

  const hasUnread = notifications.some((item) => !item.read);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu />
        </Button>

        <h2 className="truncate text-base font-semibold md:text-lg">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell size={18} />
              {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white">
            <div className="px-3 py-2 text-sm font-semibold">Notifications</div>
            {notifications.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500">No notifications yet.</div>
            ) : (
              notifications.slice(0, 6).map((item) => (
                <DropdownMenuItem key={item.id} className="flex flex-col items-start gap-1">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.message}</span>
                </DropdownMenuItem>
              ))
            )}
            {notifications.length > 0 && (
              <DropdownMenuItem onSelect={() => markNotificationsRead(role)}>
                Mark all as read
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="cursor-pointer">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/Profile">Profile</Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={logoutMutation.isPending}
              onSelect={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
