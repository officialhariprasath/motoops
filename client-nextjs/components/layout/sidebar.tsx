"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Car,
  Receipt,
  Users,
  Wrench,
  ClipboardList,
  UserCheck,
  Settings,
  Package,
  LogOut,
} from "lucide-react";

// ======================================================
// ROLE-BASED SIDEBAR CONFIG
// ======================================================

type SubMenu = {
  title: string;
  href: string;
};

type MenuItem = {
  title: string;
  href: string;
  icon: any;
  children?: SubMenu[];
};

const sidebarByRole: Record<string, MenuItem[]> = {
  admin: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      title: "Vehicles",
      href: "/dashboard/admin/vehicles",
      icon: Car,
    },
    {
      title: "Items",
      href: "/dashboard/admin/items",
      icon: Package,
    },
    {
      title: "Services",
      href: "/dashboard/admin/services",
      icon: Wrench,
      children: [
            {
              title: "List Job Cards",
              href: "/dashboard/admin/services",
            },
            {
              title: "Create Job Card",
              href: "/dashboard/admin/services/create",
            },
          ],
    },
    {
      title: "Invoices",
      href: "/dashboard/admin/invoices",
      icon: Receipt,
    },
    {
      title: "Workforce",
      href: "/dashboard/admin/workforce",
      icon: UserCheck,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: ClipboardList,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],

  mechanic: [
    {
      title: "Dashboard",
      href: "/dashboard/mechanic",
      icon: LayoutDashboard,
    },
    {
      title: "Assigned Services",
      href: "/dashboard/mechanic/services",
      icon: Wrench,
    },
    {
      title: "Leave",
      href: "/dashboard/mechanic/leave",
      icon: ClipboardList,
    },
  ],

  customer: [
    {
      title: "Dashboard",
      href: "/dashboard/user",
      icon: LayoutDashboard,
    },
    {
      title: "My Vehicles",
      href: "/dashboard/user/my-vehicles",
      icon: Car,
    },
    {
      title: "My Services",
      href: "/dashboard/user/my-services",
      icon: Wrench,
    },
    {
      title: "My Invoices",
      href: "/dashboard/user/my-invoices",
      icon: Receipt,
    },
  ],
};

sidebarByRole.user = sidebarByRole.customer;

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

// ======================================================
// SIDEBAR COMPONENT
// ======================================================

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const router = useRouter();

  const pathname = usePathname();
    const logoutMutation = useMutation({
      mutationFn: logoutUser,

      onSuccess: () => {
        localStorage.removeItem("token");

        router.push("/");
      },
    });

  // ======================================================
  // GET USER
  // ======================================================

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);
 
  const role = user?.role ?? "user";

  // ROLE MENUS
  const menus = sidebarByRole[role as keyof typeof sidebarByRole] || [];

  const allHrefs = menus.flatMap((menu) => [
    menu.href,
    ...(menu.children?.map((child) => child.href) ?? []),
  ]);

  const isExactDashboardHref = (href: string) =>
    href === "/dashboard" ||
    href === "/dashboard/mechanic" ||
    href === "/dashboard/user";

  const getBestMatch = (candidates: string[]) =>
    candidates
      .filter((href) => {
        if (isExactDashboardHref(href)) return pathname === href;
        return pathname === href || pathname.startsWith(`${href}/`);
      })
      .sort((a, b) => b.length - a.length)[0];

  const bestMatch = getBestMatch(allHrefs);

  const isItemActive = (menu: MenuItem) => {
    const childHrefs = menu.children?.map((child) => child.href) ?? [];
    if (childHrefs.some((href) => href === bestMatch)) return true;
    return menu.href === bestMatch;
  };

  const isSubActive = (href: string) => href === bestMatch;

  const sidebarClassName = mobile
    ? "flex h-full w-full flex-col bg-card"
    : "hidden md:flex h-screen w-64 flex-col border-r border-border bg-card";

  return (
    <aside className={sidebarClassName}>
      {/* ====================================================== */}
      {/* LOGO */}
      {/* ====================================================== */}

      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <img
          src="/motoops-logo.png"
          alt="MotoOps"
          className="h-10 w-auto object-contain"
        />

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-wide text-foreground">
            MOTO OPS
          </h1>

          <p className="text-xs text-muted-foreground capitalize">
            {role} panel
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* USER INFO */}
      {/* ====================================================== */}

      <div className="border-b border-border p-4">
        <p className="font-semibold text-sm text-foreground">
          {user?.name || "Guest"}
        </p>

        <p className="text-xs text-muted-foreground">
          {user?.email || ""}
        </p>
      </div>

      {/* ====================================================== */}
      {/* MENU */}
      {/* ====================================================== */}

      <nav className="flex-1 space-y-1 p-4">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = isItemActive(menu);

          return (
            <div key={menu.href}>
                <Link
                  href={menu.href}
                  onClick={onNavigate}
                >
                  <div 
                    className={`
                    flex items-center gap-3 rounded-xl px-4 py-3
                    text-sm font-medium transition-all
                    ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/80 hover:bg-muted"
                    }
                  `}
                  >
                    <Icon size={18} />
                    <span>{menu.title}</span>
                  </div>
                </Link>

                {menu.children?.map((sub) => {
                  const subActive = isSubActive(sub.href);
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={onNavigate}
                      className={`ml-10 block rounded-lg px-3 py-2 text-sm ${
                        subActive
                          ? "bg-primary/90 text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {sub.title}
                    </Link>
                  );
                })}
              </div>
          );
        })}
      </nav>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <div className="border-t border-border p-4">
        <button
          onClick={() => {
            onNavigate?.();
            logoutMutation.mutate();
          }}

          className="
            flex w-full items-center gap-3 rounded-xl
            px-4 py-3 text-sm font-medium text-destructive
            transition hover:bg-destructive/10
          "
        >
          <LogOut size={18}   />

          <span  >Logout</span>
        </button>
      </div>
    </aside>
  );
}




