"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = "default", size = "md", className = "", ...props }, ref) => {
    const variants = {
      default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      outline: "bg-transparent border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base",
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";