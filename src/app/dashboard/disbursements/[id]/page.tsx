"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Landmark, Wallet } from "lucide-react";
import { disbursementsApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusBadgeClass } from "@/lib/utils";

interface Disbursement {
  id: string;
  orderId: string;
  issuerOrderId: string;
  refId: string;
  merchantRefId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: string;
  channelType: string;
  channel: string;
  recipientAccount: string;
  recipientName: string;
  description: string;
  failureReason: string;
  createdAt: string;
  updatedAt: string;
  merchant?: { name: string; code: string };
}

const statusTimeline = [
  { key: "pending", label: "Created", icon: Clock },
  { key: "processing", label: "Processing", icon: AlertCircle },
  { key: "success", label: "Completed", icon: CheckCircle },
];

export default function DisbursementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [db, setDb] = useState<Disbursement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDb = async () => {
      try {
        const res = await disbursementsApi.get(params.id as string);
        setDb(res.data?.data || res.data);
      } catch {
        console.error("Failed to load disbursement");
      } finally {
        setLoading(false);
      }
    };
    fetchDb();
  }, [params.id]);

  if (loading || !db) {
    return (
      <div>
        <div className="page-header"><h1>Disbursement Detail</h1></div>
        <div className="page-body">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 16, borderRadius: "var(--radius-lg)" }} />)}</div>
      </div>
    );
  }

  const isFailed = db.status === "failed";
  const currentStep = isFailed ? 2 : ["pending", "processing", "success"].indexOf(db.status);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 18 }}>{db.orderId}</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Disbursement Detail</p>
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(db.status)}`} style={{ fontSize: 13 }}>{db.status}</span>
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
          {/* Disbursement Info */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Disbursement Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Amount", formatCurrency(db.amount, db.currency)],
                ["Fee", formatCurrency(db.fee, db.currency)],
                ["Net Amount", formatCurrency(db.netAmount, db.currency)],
                ["Currency", db.currency],
                ["Channel Type", db.channelType === "bank_transfer" ? "Bank Transfer" : "E-Wallet"],
                ["Channel", db.channel],
                ["Recipient Name", db.recipientName],
                ["Recipient Account", db.recipientAccount],
                ["Description", db.description || "—"],
                ...(db.failureReason ? [["Failure Reason", db.failureReason]] : []),
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference IDs & Merchant */}
          <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Reference IDs</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Order ID", db.orderId],
                  ["Issuer Order ID", db.issuerOrderId || "—"],
                  ["Ref ID", db.refId || "—"],
                  ["Merchant Ref ID", db.merchantRefId || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Parties</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["Merchant", db.merchant?.name || "—"],
                  ["Created", formatDate(db.createdAt)],
                  ["Updated", formatDate(db.updatedAt)],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
