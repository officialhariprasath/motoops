"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Car, Lock, Mail, MapPin, Phone, ShieldCheck, Sparkles, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";

type AuthView = "login" | "register";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    mobile: z.string().regex(/^\d{10,15}$/, "Mobile must be 10 to 15 digits"),
    email: z.string().email("Please enter a valid email address"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter email, username, or mobile"),
  password: z.string().min(6, "Password required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

type LoginFormData = {
  identifier: string;
  password: string;
};

const initialForm: RegisterFormData = {
  name: "",
  username: "",
  mobile: "",
  email: "",
  address: "",
  password: "",
  confirmPassword: "",
};

const registerUser = async (data: RegisterFormData) => {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Registration failed");
  }

  return result;
};

const loginUser = async (data: LoginFormData) => {
  const res = await fetch("/api/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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

export default function RegisterForm() {
  const router = useRouter();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [form, setForm] = useState<RegisterFormData>(initialForm);
  const [loginForm, setLoginForm] = useState<LoginFormData>({ identifier: "", password: "" });
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginMessageType, setLoginMessageType] = useState<"success" | "error">("error");

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      const message =
        data?.message ||
        "Registration successful. Check your email to verify your account.";
      setSuccess(message);
      setServerError(null);
      setForm(initialForm);
      setAuthView("login");
      setVerificationLink(null);

      if (data?.verificationToken) {
        const link = `/verify/${data.verificationToken}`;
        setVerificationLink(link);
      }
    },
    onError: (error: Error) => {
      setServerError(error.message);
      setSuccess(null);
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      setLoginMessage("Login successful");
      setLoginMessageType("success");
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      setLoginMessage(error.message);
      setLoginMessageType("error");
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
    if (serverError) {
      setServerError(null);
    }
    if (success) {
      setSuccess(null);
    }
  };

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    if (loginMessage) {
      setLoginMessage(null);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);

    const result = registerSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });

      setErrors(fieldErrors);
      return;
    }

    registerMutation.mutate(form);
  };

  const handleLoginSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = loginSchema.safeParse(loginForm);

    if (!result.success) {
      setLoginMessage(result.error.issues[0].message);
      setLoginMessageType("error");
      return;
    }

    loginMutation.mutate(loginForm);
  };

  const handleDemoCredentials = () => {
    setLoginForm({ identifier: "admin", password: "123456" });
    setLoginMessage(null);
  };

  const inputClassName = (fieldName: string) =>
    `w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${errors[fieldName] ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-4 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-700 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"}`;

  return (
    <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_90px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white sm:p-8 lg:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-slate-100">
            <ShieldCheck className="h-4 w-4" />
            Modern garage operations
          </div>

          <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl">
            Build trust with a polished service experience.
          </h1>

          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
            Manage vehicles, services, invoices, and customer communication from one professional workspace.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <Car className="h-4 w-4" />
              Vehicle and service tracking
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <Wrench className="h-4 w-4" />
              Mechanic task and progress updates
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <ShieldCheck className="h-4 w-4" />
              Secure admin, mechanic, and customer workflows
            </div>
          </div>
        </div>

        <div className="bg-slate-50/80 p-6 sm:p-8 lg:p-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                {authView === "login" ? "Welcome back" : "Create account"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                {authView === "login" ? "Sign in" : "Register"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthView(authView === "login" ? "register" : "login");
                setServerError(null);
                setSuccess(null);
                setLoginMessage(null);
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              {authView === "login" ? "Create account" : "Sign in"}
            </button>
          </div>

          {authView === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <button
                type="button"
                onClick={handleDemoCredentials}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <Sparkles className="h-4 w-4" />
                Use demo credentials
              </button>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email, username, or mobile</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="identifier"
                    value={loginForm.identifier}
                    placeholder="admin"
                    onChange={handleLoginChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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
                    value={loginForm.password}
                    placeholder="123456"
                    onChange={handleLoginChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </label>

              {loginMessage && (
                <div
                  className={
                    loginMessageType === "success"
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600"
                      : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                  }
                >
                  {loginMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {loginMutation.isPending && (
                <p className="text-center text-xs text-slate-500">
                  Our backend is hosted on a free tier that sleeps when idle. It may take 30–60 seconds to respond on your first sign in or sign up.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="name" placeholder="Alex Carter" onChange={handleChange} className={`${inputClassName("name")} pl-10`} />
                  </div>
                  {errors.name && <p className="mt-2 text-sm text-rose-500">{errors.name}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="username" placeholder="alexgarage" onChange={handleChange} className={`${inputClassName("username")} pl-10`} />
                  </div>
                  {errors.username && <p className="mt-2 text-sm text-rose-500">{errors.username}</p>}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Mobile</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="mobile" placeholder="0712345678" onChange={handleChange} className={`${inputClassName("mobile")} pl-10`} />
                  </div>
                  {errors.mobile && <p className="mt-2 text-sm text-rose-500">{errors.mobile}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="email" type="email" placeholder="alex@email.com" onChange={handleChange} className={`${inputClassName("email")} pl-10`} />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email}</p>}
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input name="address" placeholder="123 Service Street" onChange={handleChange} className={`${inputClassName("address")} pl-10`} />
                </div>
                {errors.address && <p className="mt-2 text-sm text-rose-500">{errors.address}</p>}
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="password" type="password" placeholder="Minimum 6 characters" onChange={handleChange} className={`${inputClassName("password")} pl-10`} />
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-rose-500">{errors.password}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="confirmPassword" type="password" placeholder="Repeat password" onChange={handleChange} className={`${inputClassName("confirmPassword")} pl-10`} />
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-rose-500">{errors.confirmPassword}</p>}
                </label>
              </div>

              {serverError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {serverError}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  <p>{success}</p>
                  {verificationLink && (
                    <p className="mt-2 text-slate-800">
                      Verify now: <Link href={verificationLink} className="font-semibold text-slate-900 underline">{verificationLink}</Link>
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {registerMutation.isPending ? "Creating account..." : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {registerMutation.isPending && (
                <p className="text-center text-xs text-slate-500">
                  Our backend is hosted on a free tier that sleeps when idle. It may take 30–60 seconds to respond on your first sign in or sign up.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

