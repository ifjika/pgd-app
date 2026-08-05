"use client";

import React from "react";
import Button from "./Button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className = "",
  style,
}) => {
  return (
    <div
      className={`pagination ${className}`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: 13,
        color: "var(--text-muted)",
        ...style,
      }}
    >
      <span>
        Page <strong style={{ color: "var(--text-primary)" }}>{page}</strong> of{" "}
        <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong>
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
