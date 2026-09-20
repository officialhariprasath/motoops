"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { getDashboardHome } from "@/lib/dashboard-home";

type Props = {
  showLogin: boolean;
  onClose: () => void;
};

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter email, username, or mobile"),
  password: z.string().min(6, "Password required"),
});

const loginUser = async (data: { identifier: string; password: string }) => {
  const res = await fetch("/api/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Login failed");
  }

  localStorage.setItem("user", JSON.stringify(result.user));
  localStorage.setItem("token", result.access_token);

  return result;
};

export default function LoginModal({ showLogin, onClose }: Props) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Login successful");
      setMessageType("success");
      // Full document navigation after Set-Cookie avoids Next soft-nav
      // "This page couldn't load" failures (esp. on mobile).
      window.location.assign(getDashboardHome(data?.user?.role));
      onClose();
    },
    onError: (error: Error) => {
      setMessage(error.message);
      setMessageType("error");
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (message) {
      setMessage(null);
    }
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = loginSchema.safeParse(form);

    if (!result.success) {
      setMessage(result.error.issues[0].message);
      setMessageType("error");
      return;
    }

    mutation.mutate(form);
  };

  const handleDemoCredentials = () => {
    setForm({ identifier: "admin", password: "123456" });
    setMessage(null);
  };

  return (
    <AnimatePresence>
      {showLogin && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/70 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-border bg-card shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid lg:grid-cols-[1.04fr_0.96fr]">
              <div className="hidden bg-primary p-8 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    Secure garage access
                  </div>
                  <h2 className="mt-6 text-3xl font-semibold leading-tight">
                    Manage services, invoices, and jobs from one polished dashboard.
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/80">
                    Sign in to keep your workflow moving with fast updates, clear task tracking, and customer-ready reporting.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-primary-foreground/90">
                  <p className="font-medium text-white">Trusted by teams that value speed and clarity.</p>
                  <p className="mt-2 text-primary-foreground/75">Professional operations for admins, mechanics, and customers alike.</p>
                </div>
              </div>

              <div className="p-8 sm:p-10">
                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">Welcome back</p>
                  <h2 className="mt-2 text-3xl font-semibold text-foreground">Sign in</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Access your garage workspace with your secure credentials.</p>
                </div>

                <button
                  type="button"
                  onClick={handleDemoCredentials}
                  className="mb-5 flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-card"
                >
                  <Sparkles className="h-4 w-4" />
                  Use demo credentials
                </button>

                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Email, username, or mobile</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        name="identifier"
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15"
                        onChange={handleChange}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        className="w-full rounded-2xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15"
                        onChange={handleChange}
                      />
                    </div>
                  </label>

                  {message && (
                    <div
                      className={
                        messageType === "success"
                          ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600"
                          : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                      }
                    >
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {mutation.isPending ? "Signing in..." : "Sign in"}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {mutation.isPending && (
                    <p className="text-center text-xs text-muted-foreground">
                      Our backend is hosted on a free tier that sleeps when idle. It may take 30-“60 seconds to respond on your first sign in or sign up.
                    </p>
                  )}
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Need an account?{" "}
                  <button type="button" onClick={onClose} className="font-semibold text-primary underline-offset-4 hover:underline">
                    Create one
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}