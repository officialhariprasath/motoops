"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Menu } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/lib/store/auth.store";

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

 // const logout = useAuthStore((s) => s.logout);

  const logoutMutation = useMutation({
  mutationFn: logoutUser,

  onSuccess: () => {
    localStorage.removeItem("token");

    router.push("/");
  },
});

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 md:px-6">
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

        <h2 className="font-semibold text-base md:text-lg">Dashboard</h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="cursor-pointer">
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
  <DropdownMenuItem>
    Profile
  </DropdownMenuItem>

  <DropdownMenuItem
    disabled={logoutMutation.isPending}
    onSelect={() => logoutMutation.mutate()}
  >
    {logoutMutation.isPending
      ? "Logging out..."
      : "Logout"}
  </DropdownMenuItem>
</DropdownMenuContent>
        
        
        
      </DropdownMenu>
    </header>
  );
}
