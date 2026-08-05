"use client";

import { useState, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import Button from "./Button";

interface MerchantOption {
  id: string;
  name: string;
}

interface MerchantSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchants: MerchantOption[];
  selectedMerchants: MerchantOption[];
  onAdd: (selected: MerchantOption[]) => void;
}

export default function MerchantSelectModal({
  isOpen,
  onClose,
  merchants,
  selectedMerchants,
  onAdd,
}: MerchantSelectModalProps) {
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<MerchantOption[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedMerchants);
      setSearch("");
    }
  }, [isOpen, selectedMerchants]);

  if (!isOpen) return null;

  const toggleSelect = (m: MerchantOption) => {
    if (tempSelected.some((item) => item.id === m.id)) {
      setTempSelected(tempSelected.filter((item) => item.id !== m.id));
    } else {
      setTempSelected([...tempSelected, m]);
    }
  };

  const filteredMerchants = merchants.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    onAdd(tempSelected);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 480,
          background: "#0c1322",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative",
          animation: "fadeIn 0.2s ease",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Select Merchants
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="input-group" style={{ width: "100%" }}>
          <Search size={16} className="input-icon" />
          <input
            className="input"
            placeholder="Search Merchants..."
            style={{ width: "100%", fontSize: 13, height: 38, background: "rgba(17, 24, 39, 0.8)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Scrollable Merchant Checklist */}
        <div
          style={{
            maxHeight: 240,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            paddingRight: 4,
          }}
        >
          {filteredMerchants.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No merchants found
            </div>
          ) : (
            filteredMerchants.map((m) => {
              const isSelected = tempSelected.some((item) => item.id === m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleSelect(m)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSelected ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.02)",
                    border: `1px solid ${isSelected ? "rgba(99, 102, 241, 0.3)" : "transparent"}`,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                      background: isSelected ? "var(--accent-primary)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                    }}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {m.name}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            Add ({tempSelected.length})
          </Button>
        </div>

      </div>
    </div>
  );
}
