"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
  getApprovedLeaveForDate,
  getDatePolicy,
  getLeaveRequests,
  saveLeaveRequests,
  type LeaveRequest,
} from "@/lib/attendance-settings";

type AttendanceStatus = "present" | "absent" | "leave";
type AttendanceMap = Record<string, AttendanceStatus>;

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

const isCompletedTask = (task: any) => {
  const status = String(task.status || "").toLowerCase();
  const subtasks = task.subtasks ?? [];

  if (status === "completed") return true;

  return (
    subtasks.length > 0 &&
    subtasks.every(
      (subtask: any) =>
        subtask.completed ||
        subtask.status === "COMPLETED" ||
        Number(subtask.progress ?? 0) >= 100
    )
  );
};

const getTaskProgress = (task: any) => {
  const subtasks = task.subtasks ?? [];
  if (isCompletedTask(task)) return 100;
  if (!subtasks.length) return 0;

  const total = subtasks.reduce(
    (sum: number, subtask: any) => sum + Number(subtask.progress ?? 0),
    0
  );

  return Math.round(total / subtasks.length);
};

const getAssignedUsers = (task: any) => {
  const users = new Map<string, any>();

  if (task.accountableTechnician?.id) {
    users.set(task.accountableTechnician.id, task.accountableTechnician);
  }

  for (const mechanic of task.mechanics ?? []) {
    if (mechanic?.id) users.set(mechanic.id, mechanic);
  }

  for (const subtask of task.subtasks ?? []) {
    if (subtask.assignedTo?.id) users.set(subtask.assignedTo.id, subtask.assignedTo);
  }

  return Array.from(users.values());
};

export default function WorkforcePage() {
  const [date, setDate] = useState(todayKey());
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const usersQuery = useQuery({ queryKey: ["workforce", "users"], queryFn: getUsers });
  const servicesQuery = useQuery({ queryKey: ["workforce", "services"], queryFn: getServices });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(attendanceStorageKey(date));
      setAttendance(saved ? JSON.parse(saved) : {});
    } catch {
      setAttendance({});
    }
  }, [date]);

  useEffect(() => {
    const sync = () => {
      setLeaveRequests(getLeaveRequests());
      setRefreshKey((current) => current + 1);
    };

    sync();
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

  const updateLeaveStatus = (requestId: string, status: "approved" | "rejected") => {
    const next = leaveRequests.map((request) =>
      request.id === requestId ? { ...request, status } : request
    );
    saveLeaveRequests(next);
    setLeaveRequests(next);
  };

  const users = usersQuery.data ?? [];
  const workforceUsers = users.filter((user: any) => !["user", "customer"].includes(String(user.role || "").toLowerCase()));
  const services = servicesQuery.data ?? [];
  const datePolicy = useMemo(() => getDatePolicy(date), [date, refreshKey]);

  const getEffectiveAttendance = (user: any) => {
    if (datePolicy.holiday) return "holiday";
    if (datePolicy.weeklyOff) return "weekend";
    if (getApprovedLeaveForDate(user.id, date)) return "leave";
    return attendance[user.id] ?? "present";
  };

  const mechanics = useMemo(
    () => workforceUsers.filter((user: any) => user.role === "mechanic"),
    [workforceUsers]
  );

  const taskRows = useMemo(() => {
    const rows: any[] = [];

    for (const service of services) {
      for (const task of service.tasks ?? []) {
        const assignedUsers = getAssignedUsers(task);
        const progress = getTaskProgress(task);
        const completed = isCompletedTask(task);

        for (const user of assignedUsers) {
          rows.push({ user, service, task, progress, completed });
        }
      }
    }

    return rows;
  }, [services]);

  const activeTaskRows = taskRows.filter((row) => !row.completed);

  const mechanicSummary = mechanics.map((mechanic: any) => {
    const assignedRows = activeTaskRows.filter((row) => row.user.id === mechanic.id);
    const status = getEffectiveAttendance(mechanic);

    return {
      mechanic,
      assignedRows,
      status,
      available: status === "present" && assignedRows.length === 0,
    };
  });

  const presentCount = workforceUsers.filter((user: any) => getEffectiveAttendance(user) === "present").length;
  const absentCount = workforceUsers.filter((user: any) => getEffectiveAttendance(user) === "absent").length;
  const leaveCount = workforceUsers.filter((user: any) => getEffectiveAttendance(user) === "leave").length;
  const availableMechanics = mechanicSummary.filter((row: any) => row.available).length;
  const pendingLeaveRequests = leaveRequests.filter((request) => request.status === "pending");

  if (usersQuery.isLoading || servicesQuery.isLoading) return <p>Loading workforce...</p>;

  if (usersQuery.error instanceof Error || servicesQuery.error instanceof Error) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workforce & Attendance</h1>
          <p className="text-sm text-gray-500">
            Monitor task load, technician progress, leave, holidays, and availability.
          </p>
        </div>

        <Link href="/dashboard/admin/services/create">
          <Button>Assign New Service</Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white px-4 py-3 text-sm">
        <span className="font-medium">Selected date:</span> {date} - {datePolicy.label}
        {!datePolicy.workingDay && (
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            Attendance is informational for this date
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Available Mechanics</p><p className="mt-2 text-2xl font-bold">{availableMechanics}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Present</p><p className="mt-2 text-2xl font-bold">{presentCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Absent</p><p className="mt-2 text-2xl font-bold">{absentCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Leave</p><p className="mt-2 text-2xl font-bold">{leaveCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pending Leave</p><p className="mt-2 text-2xl font-bold">{pendingLeaveRequests.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Attendance</h2>
              <p className="text-sm text-gray-500">
                Weekly off days, holidays, and approved leave are applied automatically.
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
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Role</th><th className="p-3 text-left">Designation</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {workforceUsers.map((user: any) => {
                  const effectiveStatus = getEffectiveAttendance(user);
                  const approvedLeave = getApprovedLeaveForDate(user.id, date);
                  const locked = effectiveStatus === "holiday" || effectiveStatus === "weekend" || Boolean(approvedLeave);

                  return (
                    <tr key={user.id} className="border-b">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3 capitalize">{user.role}</td>
                      <td className="p-3 text-gray-500">{user.designation || "-"}</td>
                      <td className="p-3 text-gray-500">{user.mobile || user.email}</td>
                      <td className="p-3">
                        {locked ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                            {approvedLeave ? approvedLeave.leaveType : effectiveStatus}
                          </span>
                        ) : (
                          <Select
                            value={attendance[user.id] ?? "present"}
                            onValueChange={(value) => saveAttendance(user.id, value as AttendanceStatus)}
                          >
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white">
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
            <p className="text-sm text-gray-500">
              Approve future mechanic leave so availability reflects it automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
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
                    className={`border-b ${dateInRange(date, request.startDate, request.endDate) ? "bg-blue-50" : ""}`}
                  >
                    <td className="p-3 font-medium">{request.mechanicName}</td>
                    <td className="p-3">{request.leaveType}</td>
                    <td className="p-3">{request.startDate} to {request.endDate}</td>
                    <td className="p-3 text-gray-600">{request.reason || "N/A"}</td>
                    <td className="p-3 capitalize">{request.status}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={request.status === "approved"}
                          onClick={() => updateLeaveStatus(request.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={request.status === "rejected"}
                          onClick={() => updateLeaveStatus(request.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {leaveRequests.length === 0 && (
                  <tr><td className="p-6 text-center text-gray-500" colSpan={6}>No leave requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Mechanic Availability</h2>
            <p className="text-sm text-gray-500">
              A mechanic is free when present and has no active assigned task.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {mechanicSummary.map(({ mechanic, assignedRows, status, available }: any) => (
              <div key={mechanic.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-semibold">{mechanic.name}</p><p className="text-xs text-gray-500">{mechanic.designation || "No designation"} - {mechanic.mobile || mechanic.email}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${available ? "bg-green-100 text-green-700" : status !== "present" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {available ? "Free" : status !== "present" ? status : "Assigned"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">Active tasks: {assignedRows.length}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div><h2 className="font-semibold">Assigned Task Progress</h2><p className="text-sm text-gray-500">See who is assigned to which task and how far the work has progressed.</p></div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="border-b"><th className="p-3 text-left">Mechanic</th><th className="p-3 text-left">Vehicle</th><th className="p-3 text-left">Task</th><th className="p-3 text-left">Progress</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Action</th></tr></thead>
              <tbody>
                {taskRows.map((row) => (
                  <tr key={`${row.task.id}-${row.user.id}`} className="border-b">
                    <td className="p-3 font-medium"><div>{row.user.name}</div><div className="text-xs font-normal text-gray-500">{row.user.designation || "No designation"}</div></td>
                    <td className="p-3"><div className="font-medium">{row.service.vehicle?.registrationNumber || "No vehicle"}</div><div className="text-xs text-gray-500">{row.service.vehicle?.brand} {row.service.vehicle?.model}</div></td>
                    <td className="p-3"><div className="font-medium">{row.task.title}</div><div className="text-xs text-gray-500">{row.service.customer?.name || "No customer"}</div></td>
                    <td className="p-3"><div className="h-2 w-32 overflow-hidden rounded bg-gray-200"><div className="h-full bg-green-500" style={{ width: `${row.progress}%` }} /></div><p className="mt-1 text-xs text-gray-500">{row.progress}%</p></td>
                    <td className="p-3 capitalize">{row.completed ? "completed" : row.task.status?.replaceAll("_", " ")}</td>
                    <td className="p-3"><Link href={`/dashboard/admin/services/${row.service.id}/edit`}><Button size="sm" variant="outline">Reassign</Button></Link></td>
                  </tr>
                ))}
                {taskRows.length === 0 && <tr><td className="p-6 text-center text-gray-500" colSpan={6}>No assigned tasks found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





