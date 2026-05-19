import { Card, CardContent } from "@/components/ui/card";

const permissions = [
  { feature: "Dashboard analytics", admin: true, mechanic: false, user: false },
  { feature: "Manage users and roles", admin: true, mechanic: false, user: false },
  { feature: "Set mechanic designation", admin: true, mechanic: false, user: false },
  { feature: "Create and edit vehicles", admin: true, mechanic: false, user: false },
  { feature: "View own vehicles", admin: true, mechanic: false, user: true },
  { feature: "Create and update service job cards", admin: true, mechanic: false, user: false },
  { feature: "View assigned service work", admin: true, mechanic: true, user: false },
  { feature: "Update task progress", admin: true, mechanic: true, user: false },
  { feature: "Add service comments", admin: true, mechanic: true, user: true },
  { feature: "Generate and update invoices", admin: true, mechanic: false, user: false },
  { feature: "View own invoices", admin: true, mechanic: false, user: true },
  { feature: "Manage procurement inventory", admin: true, mechanic: false, user: false },
  { feature: "Request tools or parts", admin: true, mechanic: true, user: false },
  { feature: "Approve leave and attendance", admin: true, mechanic: false, user: false },
  { feature: "Request future leave", admin: false, mechanic: true, user: false },
  { feature: "Configure app settings", admin: true, mechanic: false, user: false },
];

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        allowed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {allowed ? "Allowed" : "No access"}
    </span>
  );
}

export default function PermissionMatrixPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Role Permission Matrix</h1>
        <p className="text-sm text-gray-500">
          Quick access map for admin, mechanic, and customer workflows.
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-6">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b">
                <th className="p-3 text-left">Feature</th>
                <th className="p-3 text-left">Admin</th>
                <th className="p-3 text-left">Mechanic</th>
                <th className="p-3 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.feature} className="border-b">
                  <td className="p-3 font-medium">{permission.feature}</td>
                  <td className="p-3"><PermissionCell allowed={permission.admin} /></td>
                  <td className="p-3"><PermissionCell allowed={permission.mechanic} /></td>
                  <td className="p-3"><PermissionCell allowed={permission.user} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
