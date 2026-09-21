"use client";

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import MerchantSelectModal from "./MerchantSelectModal";
import Button from "./Button";

export interface FilterValues {
  statuses: string[];
  merchants: { id: string; name: string }[];
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

interface TransactionFilterPopoverProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterValues: FilterValues;
  merchantsList: { id: string; name: string }[];
  onApply: (newValues: FilterValues) => void;
  onReset: () => void;
  title?: string;
}

export default function TransactionFilterPopover({
  search,
  onSearchChange,
  filterValues,
  merchantsList,
  onApply,
  onReset,
  title = "Transaction Filter",
}: TransactionFilterPopoverProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  // Draft States inside popover
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [draftMerchants, setDraftMerchants] = useState<{ id: string; name: string }[]>([]);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftMinAmount, setDraftMinAmount] = useState("");
  const [draftMaxAmount, setDraftMaxAmount] = useState("");

  // Sync draft states when popover opens or filterValues update
  useEffect(() => {
    setDraftStatuses(filterValues.statuses);
    setDraftMerchants(filterValues.merchants);
    setDraftStartDate(filterValues.startDate);
    setDraftEndDate(filterValues.endDate);
    setDraftMinAmount(filterValues.minAmount);
    setDraftMaxAmount(filterValues.maxAmount);
  }, [filterValues, showPopover]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#filter-popover-container") && !target.closest("#merchant-select-modal")) {
        setShowPopover(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleStatus = (statusKey: string) => {
    if (draftStatuses.includes(statusKey)) {
      setDraftStatuses(draftStatuses.filter((s) => s !== statusKey));
    } else {
      setDraftStatuses([...draftStatuses, statusKey]);
    }
  };

  const handleApply = () => {
    onApply({
      statuses: draftStatuses,
      merchants: draftMerchants,
      startDate: draftStartDate,
      endDate: draftEndDate,
      minAmount: draftMinAmount,
      maxAmount: draftMaxAmount,
    });
    setShowPopover(false);
  };

  const handleReset = () => {
    setDraftStatuses([]);
    setDraftMerchants([]);
    setDraftStartDate("");
    setDraftEndDate("");
    setDraftMinAmount("");
    setDraftMaxAmount("");
    onReset();
  };

  const removeMerchantTag = (id: string) => {
    setDraftMerchants(draftMerchants.filter((m) => m.id !== id));
  };

  const activeFilterCount =
    (filterValues.statuses.length > 0 ? 1 : 0) +
    (filterValues.merchants.length > 0 ? 1 : 0) +
    (filterValues.startDate || filterValues.endDate ? 1 : 0) +
    (filterValues.minAmount || filterValues.maxAmount ? 1 : 0);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
      {/* Search Input */}
      <div className="input-group" style={{ flex: 1, maxWidth: 360 }}>
        <Search size={16} className="input-icon" />
        <input
          className="input"
          placeholder="Search Order ID / Description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Trigger Button */}
      <div style={{ position: "relative" }} id="filter-popover-container">
        <button
          type="button"
          onClick={() => setShowPopover(!showPopover)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            padding: "0 18px",
            borderRadius: 10,
            background: showPopover ? "rgba(99, 102, 241, 0.2)" : "rgba(15, 23, 42, 0.8)",
            border: showPopover ? "1px solid var(--accent-primary)" : "1px solid rgba(99, 102, 241, 0.25)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: showPopover ? "0 0 15px rgba(99, 102, 241, 0.3)" : "0 2px 8px rgba(0,0,0,0.3)",
            transition: "all 0.2s ease",
          }}
        >
          <SlidersHorizontal size={16} style={{ color: "var(--accent-primary)" }} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: "var(--accent-primary)",
                color: "#ffffff",
                borderRadius: 12,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)",
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter Popover Overlay */}
        {showPopover && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 10,
              width: 400,
              background: "rgba(13, 19, 34, 0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 16,
              padding: 22,
              zIndex: 500,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SlidersHorizontal size={16} style={{ color: "var(--accent-primary)" }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-accent)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reset All
              </button>
            </div>

            {/* Merchant Section (With Select Link matching screenshot reference) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  MERCHANT
                </label>
                <button
                  type="button"
                  onClick={() => setShowMerchantModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-primary)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Select
                </button>
              </div>

              {/* Tag Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 36, alignItems: "center" }}>
                {draftMerchants.length === 0 ? (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                    No merchants selected (Click &apos;Select&apos;)
                  </span>
                ) : (
                  draftMerchants.map((m) => (
                    <span
                      key={m.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        color: "#a78bfa",
                        padding: "4px 10px",
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {m.name}
                      <X size={13} style={{ cursor: "pointer" }} onClick={() => removeMerchantTag(m.id)} />
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Status Section (Theme Pills) */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
                STATUS
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { key: "success", label: "Success", bg: "var(--status-success-bg)", color: "var(--status-success)", border: "var(--status-success)" },
                  { key: "pending", label: "Pending", bg: "var(--status-pending-bg)", color: "var(--status-pending)", border: "var(--status-pending)" },
                  { key: "processing", label: "Processing", bg: "var(--status-processing-bg)", color: "var(--status-processing)", border: "var(--status-processing)" },
                  { key: "failed", label: "Failed", bg: "var(--status-failed-bg)", color: "var(--status-failed)", border: "var(--status-failed)" },
                  { key: "expired", label: "Expired", bg: "var(--status-expired-bg)", color: "var(--status-expired)", border: "var(--status-expired)" },
                  { key: "refunded", label: "Refunded", bg: "var(--status-refunded-bg)", color: "var(--status-refunded)", border: "var(--status-refunded)" },
                ].map((st) => {
                  const isChecked = draftStatuses.includes(st.key);
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => toggleStatus(st.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: isChecked ? st.bg : "rgba(255, 255, 255, 0.03)",
                        color: isChecked ? st.color : "var(--text-muted)",
                        border: `1px solid ${isChecked ? st.border : "var(--border-subtle)"}`,
                        boxShadow: isChecked ? `0 0 12px ${st.bg}` : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: isChecked ? st.color : "var(--text-muted)",
                        }}
                      />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Created Date */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
                CREATED DATE
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="date"
                  className="input"
                  style={{ fontSize: 12, height: 36, flex: 1, borderRadius: 8, colorScheme: "dark", background: "rgba(17, 24, 39, 0.8)" }}
                  value={draftStartDate}
                  onChange={(e) => setDraftStartDate(e.target.value)}
                />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>to</span>
                <input
                  type="date"
                  className="input"
                  style={{ fontSize: 12, height: 36, flex: 1, borderRadius: 8, colorScheme: "dark", background: "rgba(17, 24, 39, 0.8)" }}
                  value={draftEndDate}
                  onChange={(e) => setDraftEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
                AMOUNT RANGE ($)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  className="input"
                  placeholder="Min $"
                  style={{ fontSize: 12, height: 36, flex: 1, borderRadius: 8, background: "rgba(17, 24, 39, 0.8)" }}
                  value={draftMinAmount}
                  onChange={(e) => setDraftMinAmount(e.target.value)}
                />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>-</span>
                <input
                  type="number"
                  className="input"
                  placeholder="Max $"
                  style={{ fontSize: 12, height: 36, flex: 1, borderRadius: 8, background: "rgba(17, 24, 39, 0.8)" }}
                  value={draftMaxAmount}
                  onChange={(e) => setDraftMaxAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost" size="md" onClick={() => setShowPopover(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleApply}>
                Apply
              </Button>
            </div>

          </div>
        )}
      </div>

      {/* Select Merchants Modal Dialog */}
      <MerchantSelectModal
        isOpen={showMerchantModal}
        onClose={() => setShowMerchantModal(false)}
        merchants={merchantsList}
        selectedMerchants={draftMerchants}
        onAdd={(selected) => setDraftMerchants(selected)}
      />
    </div>
  );
}
