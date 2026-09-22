import type { ReactNode } from "react";

type Align = "left" | "center" | "right";

type Props = {
  as?: "td" | "th";
  align?: Align;
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  /** Extra classes for the inner content wrapper. */
  innerClassName?: string;
};

const alignClass: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Bill/estimate table cell.
 * Uses normal table-cell + padding (not flex). Screenshot/PDF engines
 * mishandle flex vertical centering inside td/th.
 */
export function DocumentTableCell({
  as = "td",
  align = "left",
  children,
  className = "",
  colSpan,
  innerClassName = "",
}: Props) {
  const Tag = as;

  return (
    <Tag
      colSpan={colSpan}
      className={`border border-[#1d4f91] p-0 align-middle ${className}`}
    >
      <div
        className={`doc-cell-inner px-1 py-1.5 leading-snug ${alignClass[align]} ${innerClassName}`}
      >
        {children}
      </div>
    </Tag>
  );
}
