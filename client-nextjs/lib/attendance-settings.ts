"use client";

export type AttendanceStatus = "present" | "absent" | "leave" | "holiday" | "weekend";
export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export type LeaveRequest = {
  id: string;
  mechanicId: string;
  mechanicName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: string;
};

export const GARAGE_SETTINGS_KEY = "garageSettings";
export const ATTENDANCE_UPDATED_EVENT = "garage-attendance-updated";
export const LEAVE_REQUESTS_KEY = "garageLeaveRequests";

export const defaultAttendanceSettings = {
  weeklyOffDays: [5],
  governmentHolidays: "",
  leaveTypes: "Sick Leave\nCasual Leave\nAnnual Leave\nEmergency Leave",
};

export function getGarageSettings() {
  if (typeof window === "undefined") return defaultAttendanceSettings;

  try {
    const saved = localStorage.getItem(GARAGE_SETTINGS_KEY);
    return { ...defaultAttendanceSettings, ...(saved ? JSON.parse(saved) : {}) };
  } catch {
    return defaultAttendanceSettings;
  }
}

export function getWeeklyOffDays(): number[] {
  const days = getGarageSettings().weeklyOffDays;
  return Array.isArray(days) ? days.map(Number) : defaultAttendanceSettings.weeklyOffDays;
}

export function getHolidayDates(): string[] {
  const value = String(getGarageSettings().governmentHolidays || "");
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getLeaveTypes(): string[] {
  const value = String(getGarageSettings().leaveTypes || "");
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getDatePolicy(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  const day = parsed.getDay();
  const weeklyOff = getWeeklyOffDays().includes(day);
  const holiday = getHolidayDates().includes(date);

  return {
    weeklyOff,
    holiday,
    workingDay: !weeklyOff && !holiday,
    label: holiday ? "Government holiday" : weeklyOff ? "Weekly off day" : "Working day",
  };
}

export function getLeaveRequests(): LeaveRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(LEAVE_REQUESTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveLeaveRequests(requests: LeaveRequest[]) {
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event(ATTENDANCE_UPDATED_EVENT));
}

export function dateInRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

export function getApprovedLeaveForDate(userId: string, date: string) {
  return getLeaveRequests().find(
    (request) =>
      request.mechanicId === userId &&
      request.status === "approved" &&
      dateInRange(date, request.startDate, request.endDate)
  );
}
