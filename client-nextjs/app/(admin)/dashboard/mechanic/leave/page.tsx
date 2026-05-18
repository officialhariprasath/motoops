"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLeaveRequests,
  getLeaveTypes,
  saveLeaveRequests,
  type LeaveRequest,
} from "@/lib/attendance-settings";

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function MechanicLeavePage() {
  const [user, setUser] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const currentUser = stored ? JSON.parse(stored) : null;
    const types = getLeaveTypes();

    setUser(currentUser);
    setLeaveTypes(types);
    setLeaveType(types[0] || "Leave");
    setRequests(getLeaveRequests());
  }, []);

  const myRequests = requests.filter((request) => request.mechanicId === user?.id);

  const submitRequest = () => {
    if (!user?.id || !leaveType || !startDate || !endDate) return;

    if (endDate < startDate) {
      setMessage("End date cannot be before start date.");
      return;
    }

    const nextRequest: LeaveRequest = {
      id: crypto.randomUUID(),
      mechanicId: user.id,
      mechanicName: user.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const nextRequests = [nextRequest, ...requests];
    saveLeaveRequests(nextRequests);
    setRequests(nextRequests);
    setReason("");
    setMessage("Leave request submitted for admin review.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <p className="text-sm text-gray-500">
          Request future leave so admin can plan task assignments.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">New Leave Request</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Leave Type</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {leaveTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <Input
                type="date"
                min={todayKey()}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <Input
                type="date"
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Briefly explain why leave is needed"
            />
          </div>

          <Button type="button" onClick={submitRequest}>
            Submit Request
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">My Requests</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Dates</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((request) => (
                  <tr key={request.id} className="border-b">
                    <td className="p-3 font-medium">{request.leaveType}</td>
                    <td className="p-3">
                      {request.startDate} to {request.endDate}
                    </td>
                    <td className="p-3 text-gray-600">{request.reason || "N/A"}</td>
                    <td className="p-3 capitalize">{request.status}</td>
                  </tr>
                ))}

                {myRequests.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={4}>
                      No leave requests yet.
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
