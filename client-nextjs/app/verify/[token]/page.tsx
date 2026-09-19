"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface VerifyPageProps {
  params: Promise<{
    token: string;
  }>;
}

type VerificationResult = {
  ok: boolean;
  message: string;
};

export default function VerifyPage({ params }: VerifyPageProps) {
  const { token } = use(params);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/verify/${token}`, { method: "GET", cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled) {
          setVerification({
            ok: res.ok,
            message: data.message || (data.error ? data.error : "Verification failed."),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerification({ ok: false, message: "Verification failed." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-[32px] border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="mb-6 rounded-3xl border border-border bg-muted px-6 py-5 text-foreground shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">Account verification</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-muted/80 p-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {verification === null ? "Verifying..." : verification.ok ? "Email verified" : "Verification failed"}
            </h1>
            <p className={`mt-3 text-sm ${verification && !verification.ok ? "text-rose-600" : "text-foreground/80"}`}>
              {verification ? verification.message : "Please wait while we verify your account."}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="block rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
