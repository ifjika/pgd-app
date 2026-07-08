"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDateShort, formatDate, getStatusBadgeClass } from "@/lib/utils";

interface Transaction {
  id: string;
  orderId: string;
  issuerOrderId?: string;
  refId?: string;
  merchantRefId?: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: string;
  description: string;
  settlementType?: string;
  settlementDate?: string;
  idempotencyKey: string;
  failureReason: string;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 15, sortBy: "createdAt", sortOrder: "DESC" };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await transactionsApi.list(params);
      setTransactions(res.data.data.data || []);
      setTotalPages(res.data.data.meta?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Close modal on Escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTxId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRowClick = async (id: string) => {
    setSelectedTxId(id);
    setLoadingTx(true);
    setTx(null);
    try {
      const res = await transactionsApi.get(id);
      setTx(res.data.data);
    } catch (err) {
      console.error("Failed to load transaction details:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  const isFailed = tx ? (tx.status === "failed" || tx.status === "expired") : false;
  const currentStep = tx ? (isFailed ? 2 : ["pending", "processing", "success"].indexOf(tx.status)) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <div className="live-indicator">
            <span className="live-dot" />
            Auto-updating
          </div>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div className="input-group" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={16} className="input-icon" />
            <input className="input" placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" style={{ width: 180 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Merchant</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: "80%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h3>No transactions found</h3></div></td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} onClick={() => handleRowClick(t.id)} style={{ cursor: "pointer" }}>
                    <td>
                      <span style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: 13 }}>
                        {t.orderId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{t.customer?.name || "—"}</td>
                    <td>{t.merchant?.name || "—"}</td>
                    <td>{t.paymentMethod?.name || "—"}</td>
                    <td className="amount">{formatCurrency(t.amount, t.currency)}</td>
                    <td><span className={`badge ${getStatusBadgeClass(t.status)}`}>{t.status}</span></td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDateShort(t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {page} of {totalPages}</span>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxId && (
        <div 
          onClick={() => setSelectedTxId(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
          }}
        >
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: "95%", maxWidth: "1300px", padding: 28, position: "relative", maxHeight: "90vh", overflowY: "auto" }}
          >
            <button onClick={() => setSelectedTxId(null)} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={20} />
            </button>

            {loadingTx || !tx ? (
              <div style={{ padding: 40 }}>
                <div className="skeleton" style={{ height: 40, width: "50%", marginBottom: 20 }} />
                <div className="skeleton" style={{ height: 100, marginBottom: 20 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="skeleton" style={{ height: 150 }} />
                  <div className="skeleton" style={{ height: 150 }} />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, margin: 0 }}>{tx.orderId}</h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Transaction Details</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(tx.status)}`} style={{ fontSize: 14 }}>{tx.status}</span>
                </div>

                {/* Status Timeline */}
                <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, marginTop: 0 }}>Status Timeline</h3>
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
                          <span style={{ fontSize: 14, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
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
                  <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>Payment Information</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        ["Amount", formatCurrency(tx.amount, tx.currency)],
                        ["Fee", formatCurrency(tx.fee, tx.currency)],
                        ["Net Amount", formatCurrency(tx.netAmount, tx.currency)],
                        ["Currency", tx.currency],
                        ["Payment Method", tx.paymentMethod?.name || "—"],
                        ["Description", tx.description || "—"],
                        ["Settlement Type", tx.settlementType || "—"],
                        ["Settlement Date", tx.settlementDate ? formatDate(tx.settlementDate) : "—"],
                        ...(tx.failureReason ? [["Failure Reason", tx.failureReason]] : []),
                      ].map(([label, value]) => (
                        <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer & Merchant & References */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>Parties</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                          ["Merchant", tx.merchant?.name || "—"],
                          ["Customer", tx.customer?.name || "—"],
                          ["Customer Email", tx.customer?.email || "—"],
                          ["Created", formatDate(tx.createdAt)],
                          ...(tx.processedAt ? [["Processed", formatDate(tx.processedAt)]] : []),
                        ].map(([label, value]) => (
                          <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>Reference IDs</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[
                          ["Order ID", tx.orderId],
                          ["Issuer Order ID", tx.issuerOrderId || "—"],
                          ["Ref ID", tx.refId || "—"],
                          ["Merchant Ref ID", tx.merchantRefId || "—"],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                            <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refunds */}
                {tx.refunds && tx.refunds.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Refunds</h3>
                    <table className="data-table" style={{ fontSize: 14 }}>
                      <thead><tr><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {tx.refunds.map(r => (
                          <tr key={r.id}>
                            <td className="amount">{formatCurrency(r.amount, tx.currency)}</td>
                            <td>{r.reason}</td>
                            <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span></td>
                            <td>{formatDateShort(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Webhook Logs */}
                {tx.webhookLogs && tx.webhookLogs.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Webhook Deliveries</h3>
                    <table className="data-table" style={{ fontSize: 14 }}>
                      <thead><tr><th>Event</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {tx.webhookLogs.map(w => (
                          <tr key={w.id}>
                            <td style={{ fontFamily: "monospace" }}>{w.event}</td>
                            <td><span className={`badge ${getStatusBadgeClass(w.deliveryStatus)}`}>{w.deliveryStatus}</span></td>
                            <td>{formatDateShort(w.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
