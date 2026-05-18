"use client";

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
}: ListControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <Input
        value={search}
        onChange={(event) => {
          onSearchChange(event.target.value);
          onPageChange(1);
        }}
        placeholder={searchPlaceholder}
        className="md:max-w-sm"
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
