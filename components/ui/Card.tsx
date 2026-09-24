"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", padding = "md", className = "", ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700",
      elevated: "bg-white dark:bg-slate-800 shadow-lg border-none",
      outlined: "bg-transparent border-2 border-slate-200 dark:border-slate-700",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    };

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${paddings[padding]} rounded-2xl ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = "", ...props }, ref) => (
    <h3 ref={ref} className={`text-xl font-bold text-slate-900 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = "", ...props }, ref) => (
    <p ref={ref} className={`mt-1 text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";