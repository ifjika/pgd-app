"use client";

import React, { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = "", style, ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {label && (
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {leftIcon && (
            <span
              style={{
                position: "absolute",
                left: 12,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`input ${className}`}
            style={{
              width: "100%",
              height: 38,
              paddingLeft: leftIcon ? 36 : 12,
              paddingRight: rightIcon ? 36 : 12,
              fontSize: 13,
              borderRadius: 8,
              background: "rgba(17, 24, 39, 0.8)",
              border: `1px solid ${error ? "var(--status-failed)" : "var(--border-primary)"}`,
              color: "var(--text-primary)",
              outline: "none",
              transition: "all 0.2s ease",
              ...style,
            }}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: "absolute",
                right: 12,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && <span style={{ fontSize: 11, color: "var(--status-failed)" }}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
