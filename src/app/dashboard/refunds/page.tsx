"use client";

import { useEffect, useState, useCallback } from "react";
import { refundsApi } from "@/lib/api";
import { formatCurrency, formatDateShort, getStatusBadgeClass } from "@/lib/utils";

interface Refund {
  id: string; amount: number; status: string; reason: string; rejectionReason: string; createdAt: string;
  transaction?: { orderId: string; amount: number; currency: string; merchant?: { name: string }; customer?: { name: string } };
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 30, sortBy: "createdAt", sortOrder: "DESC" };
      if (status) params.status = status;
      const res = await refundsApi.list(params);
      const list = res.data?.data?.data || (Array.isArray(res.data?.data) ? res.data.data : []);
      setRefunds(Array.isArray(list) ? list : []);
    } catch (err) { console.error("Failed to fetch refunds:", err); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  const handleApprove = async (id: string) => {
    try { await refundsApi.approve(id); fetchData(); } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    try { await refundsApi.reject(id, "Rejected by admin"); fetchData(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header"><h1>Refunds</h1></div>
      <div className="page-body">
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <select className="input" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Merchant</th><th>Refund Amount</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: "80%" }} /></td>)}</tr>
              )) : refunds.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><h3>No refunds found</h3></div></td></tr>
              ) : refunds.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: "var(--accent-primary)", fontSize: 13 }}>{r.transaction?.orderId || "—"}</td>
                  <td>{r.transaction?.customer?.name || "—"}</td>
                  <td>{r.transaction?.merchant?.name || "—"}</td>
                  <td className="amount">{formatCurrency(r.amount, r.transaction?.currency || "USD")}</td>
                  <td style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</td>
                  <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span></td>
                  <td style={{ fontSize: 12 }}>{formatDateShort(r.createdAt)}</td>
                  <td>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
