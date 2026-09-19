"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ListControlsProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  filters?: ReactNode;
};

export default function ListControls({
  search,
  onSearchChange,
  searchPlaceholder,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  filters,
}: ListControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 moto-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:max-w-2xl">
        <Input
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
            onPageChange(1);
          }}
          placeholder={searchPlaceholder}
          className="sm:min-w-[220px] sm:flex-1"
        />
        {filters}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {totalItems} item{totalItems === 1 ? "" : "s"} - {pageSize} per page
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-16 text-center">
          {page} / {safeTotalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
