"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DELETE_ACTIONS_UPDATED_EVENT } from "@/lib/delete-settings";
import { ATTENDANCE_UPDATED_EVENT } from "@/lib/attendance-settings";

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const defaultSettings = {
  garageName: "Auto Garage",
  phone: "",
  email: "",
  address: "",
  invoiceNote: "Thank you for choosing Auto Garage.",
  deleteActionsEnabled: false,
  listPageSize: 10,
  passwordEditingEnabled: false,
  weeklyOffDays: [5],
  governmentHolidays: "",
  leaveTypes: "Sick Leave\nCasual Leave\nAnnual Leave\nEmergency Leave",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("garageSettings");
    if (saved) {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    }
  }, []);

  const updateField = (field: keyof typeof defaultSettings, value: any) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const toggleWeeklyOffDay = (day: number) => {
    setSettings((current) => {
      const currentDays = current.weeklyOffDays ?? [];
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day].sort();

      return { ...current, weeklyOffDays: nextDays };
    });
  };

  const saveSettings = () => {
    localStorage.setItem("garageSettings", JSON.stringify(settings));
    window.dispatchEvent(new Event(DELETE_ACTIONS_UPDATED_EVENT));
    window.dispatchEvent(new Event(ATTENDANCE_UPDATED_EVENT));
    setMessage("Settings saved.");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage garage profile, attendance policy, and safety controls.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Garage Profile</h2>

          <div>
            <label className="mb-1 block text-sm font-medium">Garage Name</label>
            <Input
              value={settings.garageName}
              onChange={(event) => updateField("garageName", event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <Input
                value={settings.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={settings.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <Textarea
              value={settings.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Invoice Note</label>
            <Textarea
              value={settings.invoiceNote}
              onChange={(event) => updateField("invoiceNote", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Attendance Policy</h2>
          <p className="text-sm text-gray-500">
            Configure this for the country or region where the garage operates.
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium">Weekly Off Days</label>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {weekDays.map((day) => (
                <label key={day.value} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.weeklyOffDays.includes(day.value)}
                    onChange={() => toggleWeeklyOffDay(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Government Holidays
            </label>
            <Textarea
              value={settings.governmentHolidays}
              onChange={(event) => updateField("governmentHolidays", event.target.value)}
              placeholder="2026-02-21&#10;2026-03-26&#10;2026-12-16"
              className="min-h-28"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter one date per line in YYYY-MM-DD format. Commas also work.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Leave Types</label>
            <Textarea
              value={settings.leaveTypes}
              onChange={(event) => updateField("leaveTypes", event.target.value)}
              className="min-h-28"
            />
            <p className="mt-1 text-xs text-gray-500">
              Mechanics will choose from these leave types when requesting future leave.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Application Controls</h2>

          <div>
            <label className="mb-1 block text-sm font-medium">List Items Per Page</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={settings.listPageSize}
              onChange={(event) => updateField("listPageSize", Number(event.target.value))}
            />
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.passwordEditingEnabled}
                onChange={(event) => updateField("passwordEditingEnabled", event.target.checked)}
              />
              <span>
                <span className="block font-medium text-amber-800">Enable password editing</span>
                <span className="mt-1 block text-amber-700">
                  Keep this off unless you intentionally want password updates from forms.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.deleteActionsEnabled}
                onChange={(event) => updateField("deleteActionsEnabled", event.target.checked)}
              />
              <span>
                <span className="block font-medium text-red-700">Enable delete actions</span>
                <span className="mt-1 block text-red-600">
                  Keep this off during demos to prevent accidental data removal.
                </span>
              </span>
            </label>
          </div>

          <Button type="button" onClick={saveSettings}>
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Suggested Future Enhancements</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Persist attendance and leave requests in PostgreSQL.</li>
            <li>Add yearly leave balance per mechanic.</li>
            <li>Add overtime and late arrival tracking.</li>
            <li>Add shift templates for morning/evening workshop teams.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
