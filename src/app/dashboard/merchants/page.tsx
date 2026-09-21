"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Eye, EyeOff } from "lucide-react";
import { merchantsApi } from "@/lib/api";
import { getStatusBadgeClass, formatDate } from "@/lib/utils";

interface Merchant {
  id: string; name: string; code: string; apiKey: string; status: string;
  webhookUrl: string; feePercentage: number; defaultCurrency: string; description: string; createdAt: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await merchantsApi.list({ limit: 50 });
      setMerchants(res.data.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleKey = (id: string) => setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div className="page-header">
        <h1>Merchants</h1>
      </div>
      <div className="page-body">
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Merchant</th><th>Code</th><th>API Key</th><th>Fee %</th><th>Currency</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: "80%" }} /></td>)}</tr>
              )) : merchants.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.description}</div>
                  </td>
                  <td><code style={{ fontSize: 12, background: "var(--bg-card)", padding: "2px 8px", borderRadius: 4 }}>{m.code}</code></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ fontSize: 11 }}>{showKeys[m.id] ? m.apiKey : "pk_live_••••••••"}</code>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleKey(m.id)} style={{ padding: 4 }}>
                        {showKeys[m.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td>{m.feePercentage}%</td>
                  <td>{m.defaultCurrency}</td>
                  <td><span className={`badge ${getStatusBadgeClass(m.status)}`}>{m.status}</span></td>
                  <td style={{ fontSize: 12 }}>{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
