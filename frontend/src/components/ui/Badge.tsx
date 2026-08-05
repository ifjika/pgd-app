"use client";

import React from "react";

export type BadgeVariant =
  | "success"
  | "pending"
  | "processing"
  | "failed"
  | "expired"
  | "refunded"
  | "accent"
  | "muted";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "accent",
  showDot = true,
  size = "md",
  className = "",
  style,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
    success: { bg: "var(--status-success-bg)", color: "var(--status-success)", border: "rgba(16, 185, 129, 0.3)" },
    pending: { bg: "var(--status-pending-bg)", color: "var(--status-pending)", border: "rgba(245, 158, 11, 0.3)" },
    processing: { bg: "var(--status-processing-bg)", color: "var(--status-processing)", border: "rgba(99, 102, 241, 0.3)" },
    failed: { bg: "var(--status-failed-bg)", color: "var(--status-failed)", border: "rgba(244, 63, 94, 0.3)" },
    expired: { bg: "var(--status-expired-bg)", color: "var(--status-expired)", border: "rgba(100, 116, 139, 0.3)" },
    refunded: { bg: "var(--status-refunded-bg)", color: "var(--status-refunded)", border: "rgba(139, 92, 246, 0.3)" },
    accent: { bg: "rgba(99, 102, 241, 0.15)", color: "#a78bfa", border: "rgba(99, 102, 241, 0.3)" },
    muted: { bg: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", border: "var(--border-subtle)" },
  };

  const currentVariant = variantStyles[variant] || variantStyles.accent;
  const isSm = size === "sm";

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSm ? 4 : 6,
        padding: isSm ? "2px 8px" : "4px 12px",
        borderRadius: 16,
        fontSize: isSm ? 11 : 12,
        fontWeight: 600,
        background: currentVariant.bg,
        color: currentVariant.color,
        border: `1px solid ${currentVariant.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        ...style,
      }}
    >
      {showDot && (
        <span
          style={{
            width: isSm ? 5 : 6,
            height: isSm ? 5 : 6,
            borderRadius: "50%",
            background: currentVariant.color,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
