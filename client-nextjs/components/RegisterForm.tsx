"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, KeyRound, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";

import { getDashboardHome } from "@/lib/dashboard-home";

type AuthView = "login" | "register";

const registerSchema = z
  .object({
    accessKey: z.string().min(8, "Access key is required"),
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
  accessKey: "",
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
  const [authView, setAuthView] = useState<AuthView>("login");
  const [form, setForm] = useState<RegisterFormData>(initialForm);
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    identifier: "",
    password: "",
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginMessageType, setLoginMessageType] = useState<"success" | "error">(
    "error"
  );

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      const message =
        data?.message || "Registration successful. You can sign in now.";
      setSuccess(message);
      setServerError(null);
      setForm(initialForm);
      setAuthView("login");
      setVerificationLink(null);
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
      localStorage.setItem("user", JSON.stringify(data.user));
      setLoginMessage("Login successful");
      setLoginMessageType("success");
      // Full document navigation after Set-Cookie avoids Next soft-nav failures
      window.location.assign(getDashboardHome(data?.user?.role));
    },
    onError: (error: Error) => {
      setLoginMessage(error.message);
      setLoginMessageType("error");
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError) setServerError(null);
    if (success) setSuccess(null);
  };

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value ?? "" }));
    if (loginMessage) setLoginMessage(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
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

  const inputClassName = (fieldName: string) =>
    `w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
      errors[fieldName]
        ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
        : "border-border bg-card text-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
    }`;

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/motoops-logo.png"
          alt="MotoOps"
          className="h-16 w-auto object-contain"
        />
      </div>

      <div className="mb-6 flex rounded-full border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            setAuthView("login");
            setServerError(null);
            setSuccess(null);
            setLoginMessage(null);
          }}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            authView === "login"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthView("register");
            setServerError(null);
            setSuccess(null);
            setLoginMessage(null);
          }}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            authView === "register"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create account
        </button>
      </div>

      {authView === "login" ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Email, username, or mobile
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="identifier"
                value={loginForm.identifier ?? ""}
                placeholder="you@garage.com"
                onChange={handleLoginChange}
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="password"
                type="password"
                value={loginForm.password ?? ""}
                placeholder="Your password"
                onChange={handleLoginChange}
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {loginMutation.isPending && (
            <p className="text-center text-xs text-muted-foreground">
              First sign-in may take 30-60 seconds while the API wakes up.
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Access key
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="accessKey"
                type="password"
                autoComplete="off"
                placeholder="Provided by MotoOps"
                onChange={handleChange}
                value={form.accessKey ?? ""}
                className={`${inputClassName("accessKey")} pl-10`}
              />
            </div>
            {errors.accessKey && (
              <p className="mt-2 text-sm text-rose-500">{errors.accessKey}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              Required to open a garage account. Contact MotoOps for a key.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Full name
            </span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="name"
                value={form.name ?? ""}
                placeholder="Garage owner name"
                onChange={handleChange}
                className={`${inputClassName("name")} pl-10`}
              />
            </div>
            {errors.name && (
              <p className="mt-2 text-sm text-rose-500">{errors.name}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Username
            </span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="username"
                value={form.username ?? ""}
                placeholder="garageadmin"
                onChange={handleChange}
                className={`${inputClassName("username")} pl-10`}
              />
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-rose-500">{errors.username}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Mobile
            </span>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="mobile"
                value={form.mobile ?? ""}
                placeholder="9876543210"
                onChange={handleChange}
                className={`${inputClassName("mobile")} pl-10`}
              />
            </div>
            {errors.mobile && (
              <p className="mt-2 text-sm text-rose-500">{errors.mobile}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Email
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="email"
                type="email"
                value={form.email ?? ""}
                placeholder="owner@garage.com"
                onChange={handleChange}
                className={`${inputClassName("email")} pl-10`}
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-rose-500">{errors.email}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Address
            </span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="address"
                value={form.address ?? ""}
                placeholder="Workshop address"
                onChange={handleChange}
                className={`${inputClassName("address")} pl-10`}
              />
            </div>
            {errors.address && (
              <p className="mt-2 text-sm text-rose-500">{errors.address}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="password"
                type="password"
                value={form.password ?? ""}
                placeholder="Minimum 6 characters"
                onChange={handleChange}
                className={`${inputClassName("password")} pl-10`}
              />
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-rose-500">{errors.password}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Confirm password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword ?? ""}
                placeholder="Repeat password"
                onChange={handleChange}
                className={`${inputClassName("confirmPassword")} pl-10`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-rose-500">
                {errors.confirmPassword}
              </p>
            )}
          </label>

          {serverError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {serverError}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              <p>{success}</p>
              {verificationLink && (
                <p className="mt-2 text-foreground">
                  Verify now:{" "}
                  <Link
                    href={verificationLink}
                    className="font-semibold text-primary underline"
                  >
                    {verificationLink}
                  </Link>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {registerMutation.isPending
              ? "Creating account..."
              : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {registerMutation.isPending && (
            <p className="text-center text-xs text-muted-foreground">
              First sign-up may take 30-60 seconds while the API wakes up.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
