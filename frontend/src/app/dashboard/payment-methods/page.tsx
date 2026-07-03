"use client";

import { useEffect, useState } from "react";
import { paymentMethodsApi } from "@/lib/api";

interface PaymentMethod {
  id: string; name: string; type: string; provider: string; icon: string; isActive: boolean; additionalFee: number;
}

const typeLabels: Record<string, string> = {
  credit_card: "Credit Card", debit_card: "Debit Card", bank_transfer: "Bank Transfer", e_wallet: "E-Wallet", qris: "QRIS",
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentMethodsApi.list().then(res => { setMethods(res.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header"><h1>Payment Methods</h1></div>
      <div className="page-body">
        <div className="grid-3col">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />
          )) : methods.map((pm) => (
            <div key={pm.id} className="stat-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 32 }}>{pm.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{pm.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{typeLabels[pm.type] || pm.type}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{pm.provider}</div>
                {pm.additionalFee > 0 && (
                  <div style={{ fontSize: 11, color: "var(--accent-amber)", marginTop: 2 }}>+{pm.additionalFee}% fee</div>
                )}
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className={`badge ${pm.isActive ? "badge-success" : "badge-expired"}`}>{pm.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
