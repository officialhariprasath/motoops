import type { ReactNode } from "react";

type Align = "left" | "center" | "right";

type Props = {
  as?: "td" | "th";
  align?: Align;
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  /** Extra classes for the inner flex wrapper (e.g. uppercase, whitespace-nowrap). */
  innerClassName?: string;
};

const justifyClass: Record<Align, string> = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
};

/**
 * Bill/estimate table cell using flex centering.
 * html2canvas ignores CSS vertical-align on native td/th, so we center with flex
 * so on-screen preview and downloaded PDF match.
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
      className={`border border-[#1d4f91] p-0 ${className}`}
    >
      <div
        className={`doc-cell-inner flex min-h-[1.7em] w-full items-center px-1 py-1 ${justifyClass[align]} ${innerClassName}`}
      >
        {children}
      </div>
    </Tag>
  );
}
