"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import { getLeaveTypes } from "@/lib/attendance-settings";

const todayKey = () => new Date().toISOString().slice(0, 10);

async function fetchLeaveRequests(mechanicId?: string) {
  const qs = mechanicId ? `?mechanicId=${encodeURIComponent(mechanicId)}` : "";
  const res = await fetch(`/api/leave-requests${qs}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load leave requests");
  return (json?.data ?? json ?? []) as any[];
}

async function createLeaveRequest(body: Record<string, unknown>) {
  const res = await fetch("/api/leave-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to submit leave");
  return json?.data ?? json;
}

export default function MechanicLeavePage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
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
  }, []);

  const requestsQuery = useQuery({
    queryKey: ["leave-requests", user?.id],
    queryFn: () => fetchLeaveRequests(user.id),
    enabled: !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      setReason("");
      setMessage("Leave request submitted for admin review.");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const myRequests = requestsQuery.data ?? [];

  const submitRequest = () => {
    if (!user?.id || !leaveType || !startDate || !endDate) return;
    if (endDate < startDate) {
      setMessage("End date cannot be before start date.");
      return;
    }
    setMessage("");
    submitMutation.mutate({
      mechanicId: user.id,
      mechanicName: user.name,
      leaveType,
      startDate,
      endDate,
      reason,
    });
  };

  return (
    <div className="space-y-6">
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
                <SelectContent className="bg-card">
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
              placeholder="Optional reason"
            />
          </div>

          <Button
            type="button"
            disabled={submitMutation.isPending}
            onClick={submitRequest}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit request"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">My Requests</h2>
          {requestsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="rounded-md border px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{request.leaveType}</p>
                    <span className="capitalize text-muted-foreground">
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {String(request.startDate).slice(0, 10)} to{" "}
                    {String(request.endDate).slice(0, 10)}
                  </p>
                  {request.reason && (
                    <p className="mt-1 text-muted-foreground">{request.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
