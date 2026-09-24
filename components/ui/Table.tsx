"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  caption?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  striped = true,
  hoverable = true,
  compact = false,
  emptyMessage = "No data available",
  caption,
  className = "",
  ...props
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className={`w-full text-sm ${className}`} {...props}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300
                  ${column.headerClassName || ""}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={`
                  ${striped && rowIndex % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50" : ""}
                  ${hoverable ? "hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors" : ""}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-4 py-3 text-slate-900 dark:text-slate-100
                      ${column.className || ""}
                    `}
                  >
                    {column.render ? column.render(row, rowIndex) : (row as Record<string, unknown>)[column.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, change, changeType = "neutral", icon, variant = "default", className = "" }, ref) => {
    const variants = {
      default: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
      primary: "bg-primary-600 border-primary-600 text-white",
      success: "bg-green-600 border-green-600 text-white",
      warning: "bg-amber-600 border-amber-600 text-white",
      danger: "bg-red-600 border-red-600 text-white",
      info: "bg-blue-600 border-blue-600 text-white",
    };

    const isColored = variant !== "default";

    return (
      <div
        ref={ref}
        className={`${variants[variant]} rounded-2xl p-6 shadow-sm ${className}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${isColored ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
              {label}
            </p>
            <p className={`mt-1 text-3xl font-bold ${isColored ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
              {value}
            </p>
            {change && (
              <p className={`mt-2 text-sm font-medium flex items-center gap-1 ${
                changeType === "positive" ? "text-green-600 dark:text-green-400" :
                changeType === "negative" ? "text-red-600 dark:text-red-400" :
                "text-slate-500 dark:text-slate-400"
              }`}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-xl ${isColored ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";