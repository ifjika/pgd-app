"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { analyticsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

export default function AnalyticsPage() {
  const [chartData, setChartData] = useState<{ name: string; revenue: number; transactions: number; successRate: number }[]>([]);
  const [pmData, setPmData] = useState<{ name: string; count: number; volume: number }[]>([]);
  const [topMerchants, setTopMerchants] = useState<{ name: string; volume: number; transactions: number }[]>([]);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [chartRes, pmRes, merchantRes] = await Promise.all([
        analyticsApi.chart(period),
        analyticsApi.paymentMethods(),
        analyticsApi.topMerchants(5),
      ]);
      const chart = chartRes.data.data;
      setChartData(chart.labels.map((l: string, i: number) => ({
        name: new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: chart.revenue[i] || 0,
        transactions: chart.transactions[i] || 0,
        successRate: chart.successRate[i] || 0,
      })));
      setPmData(pmRes.data.data || []);
      setTopMerchants(merchantRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div><div className="page-header"><h1>Analytics</h1></div><div className="page-body">{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 300, marginBottom: 24, borderRadius: "var(--radius-lg)" }} />)}</div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <div className="header-actions">
          {["7d", "30d", "90d"].map((p) => (
            <button key={p} className={`btn ${period === p ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setPeriod(p)}>
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>
      <div className="page-body">
        {/* Transaction Volume Chart */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Transaction Volume</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#f1f5f9" }} />
                <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Success Rate Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Success Rate</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#f1f5f9" }} />
                  <Area type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2} fill="url(#successGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Payment Methods</h3>
            <div style={{ height: 250, display: "flex", alignItems: "center" }}>
              {pmData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pmData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pmData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#f1f5f9" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No data available</p></div>}
            </div>
          </div>
        </div>

        {/* Top Merchants */}
        <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Top Merchants by Volume</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topMerchants.map((m, i) => {
              const maxVol = topMerchants[0]?.volume || 1;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", width: 24 }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, width: 160 }}>{m.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--bg-card)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(m.volume / maxVol) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.5s ease" }} />
                  </div>
                  <span className="amount" style={{ fontSize: 13, width: 120, textAlign: "right" }}>{formatCurrency(m.volume)}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", width: 80, textAlign: "right" }}>{m.transactions} txns</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
