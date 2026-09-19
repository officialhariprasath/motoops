"use client";

export type NotificationCategory =
  | "service"
  | "invoice"
  | "payment"
  | "attendance";

export type GarageNotification = {
  id: string;
  title: string;
  message: string;
  role?: string;
  category?: NotificationCategory;
  createdAt: string;
  read: boolean;
};

const KEY = "garageNotifications";
const SETTINGS_KEY = "garageSettings";
export const GARAGE_NOTIFICATIONS_EVENT = "garage-notifications-updated";

export const notificationCategories: Array<{
  key: NotificationCategory;
  label: string;
  description: string;
}> = [
  { key: "service", label: "Service updates", description: "Service creation, job card updates, and status changes." },
  { key: "invoice", label: "Invoice updates", description: "Invoice generation and invoice document activity." },
  { key: "payment", label: "Payment updates", description: "Paid, partial, and unpaid payment changes." },
  { key: "attendance", label: "Attendance and leave", description: "Leave requests and workforce attendance updates." },
];

function getNotificationSettings() {
  if (typeof window === "undefined") return { notificationsEnabled: true };

  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      notificationsEnabled: settings.notificationsEnabled !== false,
    };
  } catch {
    return { notificationsEnabled: true };
  }
}

function canNotify(_category?: NotificationCategory) {
  const settings = getNotificationSettings();
  return settings.notificationsEnabled !== false;
}

export function getNotifications(role?: string): GarageNotification[] {
  if (typeof window === "undefined") return [];

  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]") as GarageNotification[];
    return items
      .filter((item) => !role || !item.role || item.role === role)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function addNotification(
  input: Pick<GarageNotification, "title" | "message"> & {
    role?: string;
    category?: NotificationCategory;
  }
) {
  if (typeof window === "undefined" || !canNotify(input.category)) return;

  const next: GarageNotification = {
    id: crypto.randomUUID?.() ?? `${Date.now()}`,
    title: input.title,
    message: input.message,
    role: input.role,
    category: input.category,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const current = getNotifications();
  localStorage.setItem(KEY, JSON.stringify([next, ...current].slice(0, 100)));
  window.dispatchEvent(new Event(GARAGE_NOTIFICATIONS_EVENT));
}

export function markNotificationsRead(role?: string) {
  if (typeof window === "undefined") return;

  const items = getNotifications().map((item) =>
    !role || !item.role || item.role === role ? { ...item, read: true } : item
  );
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(GARAGE_NOTIFICATIONS_EVENT));
}
