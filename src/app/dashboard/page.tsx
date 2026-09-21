"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  Store,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsApi, transactionsApi } from "@/lib/api";
import { formatCurrency, formatDateShort, getStatusBadgeClass } from "@/lib/utils";

interface OverviewData {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  activeMerchants: number;
  todayTransactions: number;
  todayVolume: number;
  pendingRefunds: number;
  totalCustomers: number;
}

interface ChartData {
  labels: string[];
  revenue: number[];
  transactions: number[];
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  merchant?: { name: string };
  customer?: { name: string };
  paymentMethod?: { name: string };
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [chartData, setChartData] = useState<{ name: string; revenue: number; transactions: number }[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, chartRes, recentRes] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.chart("7d"),
        transactionsApi.recent(8),
      ]);

      setOverview(overviewRes.data.data);

      const chart: ChartData = chartRes.data.data;
      const formatted = chart.labels.map((label: string, i: number) => ({
        name: new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: chart.revenue[i] || 0,
        transactions: chart.transactions[i] || 0,
      }));
      setChartData(formatted);

      setRecentTxns(recentRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div className="page-body">
          <div className="grid-stats">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--radius-lg)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: <DollarSign size={22} />,
      label: "Total Volume",
      value: formatCurrency(overview?.totalVolume || 0),
      color: "rgba(16, 185, 129, 0.15)",
      iconColor: "var(--status-success)",
    },
    {
      icon: <ArrowLeftRight size={22} />,
      label: "Total Transactions",
      value: (overview?.totalTransactions || 0).toLocaleString(),
      color: "rgba(99, 102, 241, 0.15)",
      iconColor: "var(--accent-primary)",
    },
    {
      icon: <TrendingUp size={22} />,
      label: "Success Rate",
      value: `${overview?.successRate || 0}%`,
      color: "rgba(6, 182, 212, 0.15)",
      iconColor: "var(--accent-cyan)",
    },
    {
      icon: <Store size={22} />,
      label: "Active Merchants",
      value: (overview?.activeMerchants || 0).toString(),
      color: "rgba(139, 92, 246, 0.15)",
      iconColor: "var(--accent-secondary)",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Real-time payment gateway overview
          </p>
        </div>
        <div className="header-actions">
          <div className="live-indicator">
            <span className="live-dot" />
            Live
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Grid */}
        <div className="grid-stats" style={{ marginBottom: 28 }}>
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div
                className="stat-icon"
                style={{ background: stat.color, color: stat.iconColor }}
              >
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts & Recent */}
        <div className="grid-2col">
          {/* Revenue Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Revenue Trend</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Last 7 days</p>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Today: {formatCurrency(overview?.todayVolume || 0)}
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Transactions</h3>
              <a
                href="/dashboard/transactions"
                style={{ fontSize: 13, color: "var(--accent-primary)", textDecoration: "none" }}
              >
                View all →
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recentTxns.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}>
                  <p>No transactions yet</p>
                </div>
              ) : (
                recentTxns.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {tx.customer?.name || "Unknown"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {tx.paymentMethod?.name} · {formatDateShort(tx.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="amount" style={{ fontSize: 13 }}>
                        {formatCurrency(tx.amount, tx.currency)}
                      </div>
                      <span className={`badge ${getStatusBadgeClass(tx.status)}`} style={{ fontSize: 10 }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
