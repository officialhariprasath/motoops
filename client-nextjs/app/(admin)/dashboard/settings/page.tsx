"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DELETE_ACTIONS_UPDATED_EVENT } from "@/lib/delete-settings";
import ImageUploadField from "@/components/dashboard/ImageUploadField";
import { previewJobCardNumber } from "@/lib/job-card-settings";
import {
  cacheGarageSettingsLocally,
  fetchGarageSettings,
  saveGarageSettingsRemote,
} from "@/lib/garage-settings-api";
import { DOCUMENT_FONT_SIZES } from "@/lib/document-font";

const defaultSettings = {
  garageName: "MotoOps",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  invoiceNote: "Thank you for choosing MotoOps.",
  invoiceLogoUrl: "/motoops-logo.png",
  jobCardPrefix: "JC",
  deleteActionsEnabled: false,
  listPageSize: 10,
  passwordEditingEnabled: false,
  notificationsEnabled: true,
  documentFontSize: 11.5,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchGarageSettings();
        if (!cancelled && remote) {
          const merged = { ...defaultSettings, ...remote };
          setSettings(merged);
          cacheGarageSettingsLocally(merged);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field: keyof typeof defaultSettings, value: any) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const saved = await saveGarageSettingsRemote(settings);
      const merged = { ...defaultSettings, ...saved };
      setSettings(merged);
      cacheGarageSettingsLocally(merged);
      window.dispatchEvent(new Event(DELETE_ACTIONS_UPDATED_EVENT));
      setSaveDialogOpen(true);
    } catch (error) {
      console.error(error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const jobCardPreview = previewJobCardNumber(settings.jobCardPrefix);

  if (loading) {
    return (
      <div className="max-w-4xl p-6 text-sm text-muted-foreground">
        Loading garage settings…
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings saved</DialogTitle>
            <DialogDescription>
              Your garage profile and preferences were saved for your garage
              account. Invoice logo and details will show on estimates and bills.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setSaveDialogOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <label className="mb-1 block text-sm font-medium">GSTIN</label>
            <Input
              value={settings.gstin}
              onChange={(event) => updateField("gstin", event.target.value)}
              placeholder="e.g. 33BQSPR3178M1ZZ"
            />
          </div>

          <ImageUploadField
            label="Invoice Logo"
            value={settings.invoiceLogoUrl}
            onChange={(value) => updateField("invoiceLogoUrl", value)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium">Invoice Note</label>
            <Textarea
              value={settings.invoiceNote}
              onChange={(event) => updateField("invoiceNote", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimate &amp; Bill Font Size
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={settings.documentFontSize}
              onChange={(event) =>
                updateField("documentFontSize", Number(event.target.value))
              }
            >
              {DOCUMENT_FONT_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Controls text size on estimate and bill screens and downloaded PDFs.
              Layout scales with the chosen size.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Job Card Numbering</h2>
          <p className="text-sm text-muted-foreground">
            Job card numbers are generated as prefix + year + month + date + daily serial.
            Example: JC202609180001
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">Job Card Prefix</label>
            <Input
              value={settings.jobCardPrefix}
              onChange={(event) => updateField("jobCardPrefix", event.target.value)}
              placeholder="JC"
            />
          </div>

          <div className="rounded-md border bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">Next job card will be: </span>
            <span className="font-semibold text-foreground">{jobCardPreview}</span>
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
              onChange={(event) =>
                updateField("listPageSize", Number(event.target.value))
              }
            />
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.passwordEditingEnabled}
                onChange={(event) =>
                  updateField("passwordEditingEnabled", event.target.checked)
                }
              />
              <span>
                <span className="block font-medium text-amber-800">
                  Enable password editing
                </span>
                <span className="mt-1 block text-amber-700">
                  Keep this off unless you intentionally want password updates from forms.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-lg border bg-muted p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.notificationsEnabled}
                onChange={(event) =>
                  updateField("notificationsEnabled", event.target.checked)
                }
              />
              <span>
                <span className="block font-medium text-foreground">
                  Enable notifications
                </span>
                <span className="mt-1 block text-muted-foreground">
                  Turn this off to disable all in-app notification alerts.
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
                </span>
              </span>
            </label>
          </div>

          <Button type="button" onClick={saveSettings} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
