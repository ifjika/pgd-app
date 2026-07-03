"use client";

import { useEffect, useState, useCallback } from "react";
import { webhooksApi } from "@/lib/api";
import { formatDateShort, getStatusBadgeClass } from "@/lib/utils";

interface WebhookLog {
  id: string; event: string; deliveryStatus: string; statusCode: number; attempts: number; response: string; createdAt: string;
  merchant?: { name: string }; transaction?: { orderId: string };
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try { const res = await webhooksApi.list({ limit: 30 }); setLogs(res.data.data.data || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  return (
    <div>
      <div className="page-header"><h1>Webhook Logs</h1></div>
      <div className="page-body">
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Event</th><th>Merchant</th><th>Order</th><th>Status</th><th>Code</th><th>Attempts</th><th>Date</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: "80%" }} /></td>)}</tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h3>No webhook logs</h3></div></td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} onClick={() => setExpandedId(expandedId === l.id ? null : l.id)} style={{ cursor: "pointer" }}>
                  <td><code style={{ fontSize: 12, background: "var(--bg-card)", padding: "2px 8px", borderRadius: 4, color: "var(--accent-primary)" }}>{l.event}</code></td>
                  <td>{l.merchant?.name || "—"}</td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{l.transaction?.orderId || "—"}</td>
                  <td><span className={`badge ${getStatusBadgeClass(l.deliveryStatus)}`}>{l.deliveryStatus}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{l.statusCode}</td>
                  <td>{l.attempts}</td>
                  <td style={{ fontSize: 12 }}>{formatDateShort(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
