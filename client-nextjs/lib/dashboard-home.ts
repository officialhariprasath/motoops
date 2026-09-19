/** Role-based landing path after login / when hitting /dashboard. */
export function getDashboardHome(role?: string | null): string {
  const normalized = String(role || "")
    .toLowerCase()
    .trim();

  if (normalized === "mechanic") return "/dashboard/mechanic";
  if (normalized === "customer" || normalized === "user") {
    return "/dashboard/user";
  }
  return "/dashboard";
}

export function canAccessAdminRoutes(role?: string | null): boolean {
  const normalized = String(role || "")
    .toLowerCase()
    .trim();
  return normalized === "admin" || normalized === "owner";
}
