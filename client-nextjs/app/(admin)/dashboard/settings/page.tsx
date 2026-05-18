"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DELETE_ACTIONS_UPDATED_EVENT } from "@/lib/delete-settings";

const defaultSettings = {
  garageName: "Auto Garage",
  phone: "",
  email: "",
  address: "",
  invoiceNote: "Thank you for choosing Auto Garage.",
  deleteActionsEnabled: false,
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

  const updateField = (
    field: keyof typeof defaultSettings,
    value: string | boolean
  ) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem("garageSettings", JSON.stringify(settings));
    window.dispatchEvent(new Event(DELETE_ACTIONS_UPDATED_EVENT));
    setMessage("Settings saved.");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage garage profile and invoice print defaults.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
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
              onChange={(event) =>
                updateField("invoiceNote", event.target.value)
              }
            />
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.deleteActionsEnabled}
                onChange={(event) =>
                  updateField("deleteActionsEnabled", event.target.checked)
                }
              />
              <span>
                <span className="block font-medium text-red-700">
                  Enable delete actions
                </span>
                <span className="mt-1 block text-red-600">
                  Keep this off during demos to prevent accidental data removal.
                  Turn it on only when you intentionally need delete buttons to work.
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
          <h2 className="font-semibold">Suggested Next Settings</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Default tax rate for new services.</li>
            <li>Invoice number prefix and footer policy.</li>
            <li>Notification templates for service updates.</li>
            <li>Role permission toggles for mechanics and users.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}



