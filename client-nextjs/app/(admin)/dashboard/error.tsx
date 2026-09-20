"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Dashboard failed to load
      </h2>
      <p className="text-sm text-muted-foreground">
        Something went wrong while opening your workspace. Try again, or sign
        in once more.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Back to sign in</Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            window.location.assign("/dashboard");
          }}
        >
          Reload dashboard
        </Button>
      </div>
    </div>
  );
}
