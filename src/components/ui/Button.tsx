"use client";

import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    // Height & Padding mapping
    const sizeStyles = {
      sm: { height: 32, padding: "0 14px", fontSize: 12, borderRadius: 6 },
      md: { height: 38, padding: "0 18px", fontSize: 13, borderRadius: 8 },
      lg: { height: 44, padding: "0 24px", fontSize: 14, borderRadius: 10 },
    }[size];

    // Variant color & background mapping
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: "var(--gradient-primary)",
        color: "#ffffff",
        border: "none",
        fontWeight: 600,
        boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
      },
      secondary: {
        background: "rgba(99, 102, 241, 0.15)",
        color: "var(--text-accent)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        fontWeight: 600,
      },
      outline: {
        background: "rgba(15, 23, 42, 0.8)",
        color: "var(--text-primary)",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        fontWeight: 600,
      },
      ghost: {
        background: "rgba(255, 255, 255, 0.05)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border-subtle)",
        fontWeight: 600,
      },
      danger: {
        background: "rgba(244, 63, 94, 0.15)",
        color: "var(--status-failed)",
        border: "1px solid rgba(244, 63, 94, 0.3)",
        fontWeight: 600,
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
          opacity: disabled || isLoading ? 0.6 : 1,
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
          ...sizeStyles,
          ...variantStyles[variant],
          ...style,
        }}
        className={`btn ${className}`}
        {...props}
      >
        {isLoading ? (
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
