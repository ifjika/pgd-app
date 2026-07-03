"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDateShort, getStatusBadgeClass, truncateId } from "@/lib/utils";

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  merchant?: { name: string };
  customer?: { name: string };
  paymentMethod?: { name: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

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
                transactions.map((tx) => (
                  <tr key={tx.id} style={{ cursor: "pointer" }}>
                    <td>
                      <Link href={`/dashboard/transactions/${tx.id}`} style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
                        {tx.orderId}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{tx.customer?.name || "—"}</td>
                    <td>{tx.merchant?.name || "—"}</td>
                    <td>{tx.paymentMethod?.name || "—"}</td>
                    <td className="amount">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td><span className={`badge ${getStatusBadgeClass(tx.status)}`}>{tx.status}</span></td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDateShort(tx.createdAt)}</td>
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
    </div>
  );
}
