"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";

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
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      setMessage("Login successful");
      setMessageType("success");
      router.push("/dashboard");
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/20 bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid lg:grid-cols-[1.04fr_0.96fr]">
              <div className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white lg:flex lg:flex-col lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    Secure garage access
                  </div>
                  <h2 className="mt-6 text-3xl font-semibold leading-tight">
                    Manage services, invoices, and jobs from one polished dashboard.
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                    Sign in to keep your workflow moving with fast updates, clear task tracking, and customer-ready reporting.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                  <p className="font-medium text-white">Trusted by teams that value speed and clarity.</p>
                  <p className="mt-2 text-slate-300">Professional operations for admins, mechanics, and customers alike.</p>
                </div>
              </div>

              <div className="p-8 sm:p-10">
                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Welcome back</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Sign in</h2>
                  <p className="mt-2 text-sm text-slate-600">Access your garage workspace with your secure credentials.</p>
                </div>

                <button
                  type="button"
                  onClick={handleDemoCredentials}
                  className="mb-5 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  <Sparkles className="h-4 w-4" />
                  Use demo credentials
                </button>

                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Email, username, or mobile</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="identifier"
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                        onChange={handleChange}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {mutation.isPending ? "Signing in..." : "Sign in"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                  Need an account?{" "}
                  <button type="button" onClick={onClose} className="font-semibold text-slate-900 underline-offset-4 hover:underline">
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