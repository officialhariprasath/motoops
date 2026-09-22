"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ATTENDANCE_UPDATED_EVENT,
  dateInRange,
  getDatePolicy,
} from "@/lib/attendance-settings";
import {
  formatJobCardStatus,
  jobCardStatusTone,
  normalizeJobCardStatus,
} from "@/lib/job-card-status";
import WorkforceEmployeeForm from "./WorkforceEmployeeForm";

type AttendanceStatus = "present" | "absent" | "leave";
type AttendanceMap = Record<string, AttendanceStatus>;
type LeaveRequestRow = {
  id: string;
  mechanicId: string;
  mechanicName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const attendanceStorageKey = (date: string) => `garageAttendance:${date}`;

const getUsers = async () => {
  const res = await fetch("/api/user", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load users");
  return json?.data ?? json ?? [];
};

const getServices = async () => {
  const res = await fetch("/api/services", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load services");
  return json?.data ?? json ?? [];
};

const getLeaveRequestsApi = async (): Promise<LeaveRequestRow[]> => {
  const res = await fetch("/api/leave-requests", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load leave requests");
  return (json?.data ?? json ?? []).map((row: any) => ({
    ...row,
    startDate: String(row.startDate).slice(0, 10),
    endDate: String(row.endDate).slice(0, 10),
  }));
};

const ACTIVE_JOB_STATUSES = new Set(["PENDING", "ASSIGNED", "IN_PROGRESS"]);

export default function WorkforcePage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayKey());
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const usersQuery = useQuery({
    queryKey: ["workforce", "users"],
    queryFn: getUsers,
  });
  const servicesQuery = useQuery({
    queryKey: ["workforce", "services"],
    queryFn: getServices,
  });
  const leaveQuery = useQuery({
    queryKey: ["leave-requests"],
    queryFn: getLeaveRequestsApi,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(attendanceStorageKey(date));
      setAttendance(saved ? JSON.parse(saved) : {});
    } catch {
      setAttendance({});
    }
  }, [date]);

  useEffect(() => {
    const sync = () => setRefreshKey((current) => current + 1);
    window.addEventListener("storage", sync);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, sync);
    };
  }, []);

  const saveAttendance = (userId: string, status: AttendanceStatus) => {
    setAttendance((current) => {
      const next = { ...current, [userId]: status };
      localStorage.setItem(attendanceStorageKey(date), JSON.stringify(next));
      return next;
    });
  };

  const leaveRequests = leaveQuery.data ?? [];

  const getApprovedLeaveForDate = (userId: string, day: string) =>
    leaveRequests.find(
      (request) =>
        request.mechanicId === userId &&
        request.status === "approved" &&
        dateInRange(day, request.startDate, request.endDate)
    );

  const updateLeaveStatus = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    const res = await fetch(`/api/leave-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || "Failed to update leave");
    }
    await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
  };

  const users = usersQuery.data ?? [];
  const workforceUsers = users.filter(
    (user: any) =>
      !["user", "customer"].includes(String(user.role || "").toLowerCase())
  );
  const services = servicesQuery.data ?? [];
  const datePolicy = useMemo(() => getDatePolicy(date), [date, refreshKey]);

  const getEffectiveAttendance = (user: any) => {
    if (datePolicy.holiday) return "holiday";
    if (datePolicy.weeklyOff) return "weekend";
    if (getApprovedLeaveForDate(user.id, date)) return "leave";
    return attendance[user.id] ?? "present";
  };

  const mechanics = useMemo(
    () =>
      workforceUsers.filter(
        (user: any) => String(user.role || "").toLowerCase() === "mechanic"
      ),
    [workforceUsers]
  );

  const jobRows = useMemo(() => {
    const rows: any[] = [];
    for (const service of services) {
      const status = normalizeJobCardStatus(service.status);
      for (const mechanic of service.assignedMechanics ?? []) {
        if (!mechanic?.id) continue;
        rows.push({
          mechanic,
          service,
          status,
          active: ACTIVE_JOB_STATUSES.has(status),
        });
      }
    }
    return rows;
  }, [services]);

  const activeJobRows = jobRows.filter((row) => row.active);

  const mechanicSummary = mechanics.map((mechanic: any) => {
    const assignedRows = activeJobRows.filter(
      (row) => row.mechanic.id === mechanic.id
    );
    const status = getEffectiveAttendance(mechanic);
    return {
      mechanic,
      assignedRows,
      status,
      available: status === "present" && assignedRows.length === 0,
    };
  });

  const presentCount = workforceUsers.filter(
    (user: any) => getEffectiveAttendance(user) === "present"
  ).length;
  const absentCount = workforceUsers.filter(
    (user: any) => getEffectiveAttendance(user) === "absent"
  ).length;
  const leaveCount = workforceUsers.filter(
    (user: any) => getEffectiveAttendance(user) === "leave"
  ).length;
  const availableMechanics = mechanicSummary.filter(
    (row: any) => row.available
  ).length;
  const pendingLeaveRequests = leaveRequests.filter(
    (request) => request.status === "pending"
  );

  const refreshEmployees = () => {
    queryClient.invalidateQueries({ queryKey: ["workforce", "users"] });
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };

  if (usersQuery.isLoading || servicesQuery.isLoading) {
    return <p>Loading workforce...</p>;
  }

  if (
    usersQuery.error instanceof Error ||
    servicesQuery.error instanceof Error
  ) {
    return (
      <p className="text-sm text-red-600">
        {usersQuery.error instanceof Error
          ? usersQuery.error.message
          : servicesQuery.error instanceof Error
            ? servicesQuery.error.message
            : "Failed to load workforce"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          onClick={() => {
            setEditingEmployee(null);
            setShowEmployeeForm(true);
          }}
        >
          Add employee
        </Button>
      </div>

      {showEmployeeForm && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">
                {editingEmployee ? "Edit employee" : "New workforce employee"}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEmployeeForm(false);
                  setEditingEmployee(null);
                }}
              >
                Close
              </Button>
            </div>
            <WorkforceEmployeeForm
              editingUser={editingEmployee}
              onSuccess={refreshEmployees}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Employees</h2>
            <p className="text-sm text-muted-foreground">
              Mechanics with login access. Temporary password can be reset here.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Username</th>
                  <th className="p-3 text-left">Designation</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {mechanics.map((user: any) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3">{user.username}</td>
                    <td className="p-3 text-muted-foreground">
                      {user.designation || "-"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {user.mobile || user.email}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEmployee(user);
                          setShowEmployeeForm(true);
                        }}
                      >
                        Edit / reset password
                      </Button>
                    </td>
                  </tr>
                ))}
                {mechanics.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No mechanics yet. Add an employee to create their login.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
        <span className="font-medium">Selected date:</span> {date} -{" "}
        {datePolicy.label}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available Mechanics</p>
            <p className="mt-2 text-2xl font-bold">{availableMechanics}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="mt-2 text-2xl font-bold">{presentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="mt-2 text-2xl font-bold">{absentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Leave</p>
            <p className="mt-2 text-2xl font-bold">{leaveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Leave</p>
            <p className="mt-2 text-2xl font-bold">
              {pendingLeaveRequests.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Attendance</h2>
              <p className="text-sm text-muted-foreground">
                Stored in this browser for now (multi-device sync comes later).
              </p>
            </div>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Designation</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {workforceUsers.map((user: any) => {
                  const effectiveStatus = getEffectiveAttendance(user);
                  const approvedLeave = getApprovedLeaveForDate(user.id, date);
                  const locked =
                    effectiveStatus === "holiday" ||
                    effectiveStatus === "weekend" ||
                    Boolean(approvedLeave);

                  return (
                    <tr key={user.id} className="border-b">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3 capitalize">{user.role}</td>
                      <td className="p-3 text-muted-foreground">
                        {user.designation || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {user.mobile || user.email}
                      </td>
                      <td className="p-3">
                        {locked ? (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-foreground/80">
                            {approvedLeave
                              ? approvedLeave.leaveType
                              : effectiveStatus}
                          </span>
                        ) : (
                          <Select
                            value={attendance[user.id] ?? "present"}
                            onValueChange={(value) =>
                              saveAttendance(user.id, value as AttendanceStatus)
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="leave">Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Leave Requests</h2>
            <p className="text-sm text-muted-foreground">
              Approve future mechanic leave so availability reflects it.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-3 text-left">Mechanic</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Dates</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr
                    key={request.id}
                    className={`border-b ${
                      dateInRange(date, request.startDate, request.endDate)
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <td className="p-3 font-medium">{request.mechanicName}</td>
                    <td className="p-3">{request.leaveType}</td>
                    <td className="p-3">
                      {request.startDate} to {request.endDate}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {request.reason || "N/A"}
                    </td>
                    <td className="p-3 capitalize">{request.status}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={request.status === "approved"}
                          onClick={() =>
                            updateLeaveStatus(request.id, "approved")
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={request.status === "rejected"}
                          onClick={() =>
                            updateLeaveStatus(request.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leaveQuery.isLoading ? (
                  <tr>
                    <td
                      className="p-6 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      Loading leave requests...
                    </td>
                  </tr>
                ) : leaveRequests.length === 0 ? (
                  <tr>
                    <td
                      className="p-6 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      No leave requests yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Mechanic Availability</h2>
            <p className="text-sm text-muted-foreground">
              Free when present and has no active assigned job cards.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {mechanicSummary.map(
              ({ mechanic, assignedRows, status, available }: any) => (
                <div key={mechanic.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{mechanic.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {mechanic.designation || "No designation"} -{" "}
                        {mechanic.mobile || mechanic.email}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        available
                          ? "bg-green-100 text-green-700"
                          : status !== "present"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {available
                        ? "Free"
                        : status !== "present"
                          ? status
                          : "Assigned"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Active jobs: {assignedRows.length}
                  </p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Assigned Jobs</h2>
            <p className="text-sm text-muted-foreground">
              Job cards assigned to mechanics (job-level workforce).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-3 text-left">Mechanic</th>
                  <th className="p-3 text-left">Job / Vehicle</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobRows.map((row) => (
                  <tr
                    key={`${row.service.id}-${row.mechanic.id}`}
                    className="border-b"
                  >
                    <td className="p-3 font-medium">
                      <div>{row.mechanic.name}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {row.mechanic.designation || "No designation"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {row.service.jobCardNumber || "Job"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.service.vehicle?.registrationNumber || "No vehicle"}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.service.customer?.name || "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${jobCardStatusTone(
                          row.status
                        )}`}
                      >
                        {formatJobCardStatus(row.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/admin/services/${row.service.id}`}
                      >
                        <Button size="sm" variant="outline">
                          Open / assign
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {jobRows.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No assigned jobs found. Assign mechanics on a job card.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
