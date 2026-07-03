"use client";

import { useEffect, useState, useCallback } from "react";
import { customersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string; name: string; email: string; phone: string; city: string; country: string; createdAt: string;
  merchant?: { name: string };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const res = await customersApi.list({ page, limit: 20 });
      setCustomers(res.data.data.data || []);
      setTotalPages(res.data.data.meta?.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="page-header"><h1>Customers</h1></div>
      <div className="page-body">
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Merchant</th><th>Created</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: "80%" }} /></td>)}</tr>
              )) : customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.city && c.country ? `${c.city}, ${c.country}` : "—"}</td>
                  <td>{c.merchant?.name || "—"}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
