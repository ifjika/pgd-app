"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusBadgeClass } from "@/lib/utils";

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: string;
  description: string;
  idempotencyKey: string;
  failureReason: string;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  merchant?: { name: string; code: string };
  customer?: { name: string; email: string };
  paymentMethod?: { name: string; type: string };
  refunds?: { id: string; amount: number; status: string; reason: string; createdAt: string }[];
  webhookLogs?: { id: string; event: string; deliveryStatus: string; createdAt: string }[];
}

const statusTimeline = [
  { key: "pending", label: "Created", icon: Clock },
  { key: "processing", label: "Processing", icon: AlertCircle },
  { key: "success", label: "Completed", icon: CheckCircle },
];

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await transactionsApi.get(params.id as string);
        setTx(res.data.data);
      } catch {
        console.error("Failed to load transaction");
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [params.id]);

  if (loading || !tx) {
    return (
      <div>
        <div className="page-header"><h1>Transaction Detail</h1></div>
        <div className="page-body">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 16, borderRadius: "var(--radius-lg)" }} />)}</div>
      </div>
    );
  }

  const isFailed = tx.status === "failed" || tx.status === "expired";
  const currentStep = isFailed ? 2 : ["pending", "processing", "success"].indexOf(tx.status);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 18 }}>{tx.orderId}</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Transaction Detail</p>
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(tx.status)}`} style={{ fontSize: 13 }}>{tx.status}</span>
      </div>

      <div className="page-body">
        {/* Status Timeline */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Status Timeline</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {statusTimeline.map((step, i) => {
              const isActive = i <= currentStep;
              const Icon = isFailed && i === 2 ? XCircle : step.icon;
              return (
                <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: isActive ? (isFailed && i === 2 ? "var(--status-failed-bg)" : "var(--status-success-bg)") : "var(--bg-card)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isActive ? (isFailed && i === 2 ? "var(--status-failed)" : "var(--status-success)") : "var(--text-muted)",
                  }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: 13, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {isFailed && i === 2 ? "Failed" : step.label}
                  </span>
                  {i < statusTimeline.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: isActive ? "var(--accent-primary)" : "var(--border-subtle)", borderRadius: 1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Payment Info */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Payment Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Amount", formatCurrency(tx.amount, tx.currency)],
                ["Fee", formatCurrency(tx.fee, tx.currency)],
                ["Net Amount", formatCurrency(tx.netAmount, tx.currency)],
                ["Currency", tx.currency],
                ["Payment Method", tx.paymentMethod?.name || "—"],
                ["Description", tx.description || "—"],
                ...(tx.failureReason ? [["Failure Reason", tx.failureReason]] : []),
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Merchant */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Parties</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Merchant", tx.merchant?.name || "—"],
                ["Customer", tx.customer?.name || "—"],
                ["Customer Email", tx.customer?.email || "—"],
                ["Created", formatDate(tx.createdAt)],
                ...(tx.processedAt ? [["Processed", formatDate(tx.processedAt)]] : []),
                ["Idempotency Key", tx.idempotencyKey?.substring(0, 16) + "..."],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refunds */}
        {tx.refunds && tx.refunds.length > 0 && (
          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Refunds</h3>
            <table className="data-table">
              <thead><tr><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {tx.refunds.map(r => (
                  <tr key={r.id}>
                    <td className="amount">{formatCurrency(r.amount, tx.currency)}</td>
                    <td>{r.reason}</td>
                    <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12 }}>{formatDateShort(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Webhook Logs */}
        {tx.webhookLogs && tx.webhookLogs.length > 0 && (
          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Webhook Deliveries</h3>
            <table className="data-table">
              <thead><tr><th>Event</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {tx.webhookLogs.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{w.event}</td>
                    <td><span className={`badge ${getStatusBadgeClass(w.deliveryStatus)}`}>{w.deliveryStatus}</span></td>
                    <td style={{ fontSize: 12 }}>{formatDateShort(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
