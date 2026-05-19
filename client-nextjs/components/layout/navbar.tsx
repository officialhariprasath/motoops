"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type NavbarProps = {
  onMenuClick?: () => void;
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [notifications, setNotifications] = useState<GarageNotification[]>([]);

  useEffect(() => {
    const sync = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(user.role || "");
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
      <div className="flex items-center gap-3">
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

        <h2 className="text-base font-semibold md:text-lg">Dashboard</h2>
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
              <AvatarFallback>AD</AvatarFallback>
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
