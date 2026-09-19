"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, KeyRound, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";

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
  const router = useRouter();
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
        data?.message ||
        "Registration successful. Check your email to verify your account.";
      setSuccess(message);
      setServerError(null);
      setForm(initialForm);
      setAuthView("login");
      setVerificationLink(null);

      if (data?.verificationToken) {
        setVerificationLink(`/verify/${data.verificationToken}`);
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
        : "border-slate-200 bg-white text-slate-700 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    }`;

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/motoops-logo.png"
          alt="MotoOps"
          className="h-16 w-auto object-contain"
        />
      </div>

      <div className="mb-6 flex rounded-full border border-slate-200 bg-slate-50 p-1">
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
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
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
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Create account
        </button>
      </div>

      {authView === "login" ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Email, username, or mobile
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="identifier"
                value={loginForm.identifier ?? ""}
                placeholder="you@garage.com"
                onChange={handleLoginChange}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="password"
                type="password"
                value={loginForm.password ?? ""}
                placeholder="Your password"
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
              First sign-in may take 30–60 seconds while the API wakes up.
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Access key
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <p className="mt-1.5 text-xs text-slate-500">
              Required to open a garage account. Contact MotoOps for a key.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Mobile
            </span>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Address
            </span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Confirm password
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                <p className="mt-2 text-slate-800">
                  Verify now:{" "}
                  <Link
                    href={verificationLink}
                    className="font-semibold text-slate-900 underline"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {registerMutation.isPending
              ? "Creating account..."
              : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {registerMutation.isPending && (
            <p className="text-center text-xs text-slate-500">
              First sign-up may take 30–60 seconds while the API wakes up.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
