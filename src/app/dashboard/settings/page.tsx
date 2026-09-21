"use client";

import { useEffect, useState } from "react";
import { Zap, ZapOff, Play, Check } from "lucide-react";
import { simulatorApi } from "@/lib/api";

export default function SettingsPage() {
  const [simulatorEnabled, setSimulatorEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);

  useEffect(() => {
    simulatorApi.status().then(res => setSimulatorEnabled(res.data.data?.enabled ?? true)).catch(() => {});
  }, []);

  const toggleSimulator = async () => {
    setLoading(true);
    try {
      const res = await simulatorApi.toggle(!simulatorEnabled);
      setSimulatorEnabled(res.data.data?.enabled ?? !simulatorEnabled);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleManualTrigger = async () => {
    setTriggering(true);
    setTriggerSuccess(false);
    try {
      await simulatorApi.trigger(true);
      setTriggerSuccess(true);
      setTimeout(() => setTriggerSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Settings</h1></div>
      <div className="page-body">
        {/* Simulator Control */}
        <div className="glass-card" style={{ padding: 24, maxWidth: 600 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Transaction Simulator</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
            The simulator automatically generates dummy transactions, processes payments, creates refunds, and fires webhooks at regular intervals to simulate real-world payment gateway activity.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
              borderRadius: "var(--radius-md)", background: simulatorEnabled ? "var(--status-success-bg)" : "var(--status-failed-bg)",
              border: `1px solid ${simulatorEnabled ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
            }}>
              {simulatorEnabled ? <Zap size={18} color="var(--status-success)" /> : <ZapOff size={18} color="var(--status-failed)" />}
              <span style={{ fontSize: 14, fontWeight: 600, color: simulatorEnabled ? "var(--status-success)" : "var(--status-failed)" }}>
                {simulatorEnabled ? "Running" : "Stopped"}
              </span>
            </div>
            <button className={`btn ${simulatorEnabled ? "btn-danger" : "btn-primary"}`} onClick={toggleSimulator} disabled={loading}>
              {loading ? "..." : simulatorEnabled ? "Stop Simulator" : "Start Simulator"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleManualTrigger}
              disabled={triggering}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {triggerSuccess ? <Check size={16} color="var(--status-success)" /> : <Play size={16} />}
              {triggering ? "Running..." : triggerSuccess ? "Triggered!" : "Simulate 1 Cycle"}
            </button>
          </div>
          <div style={{ marginTop: 20, padding: 16, borderRadius: "var(--radius-sm)", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <strong>Intervals:</strong><br />
              • New transactions: every 15 seconds (1-3 per cycle)<br />
              • Process pending: every 30 seconds (85% success rate)<br />
              • Create refunds: every 60 seconds (20% chance)<br />
              • Process refunds: every 120 seconds (80% approved)
            </p>
          </div>
        </div>

        {/* App Info */}
        <div className="glass-card" style={{ padding: 24, maxWidth: 600, marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Application Info</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["App Name", "Payment Gateway Dummy (PGD)"],
              ["Version", "1.0.0"],
              ["Backend", "NestJS + TypeORM"],
              ["Frontend", "Next.js + React"],
              ["Database", "TiDB Cloud (MySQL)"],
              ["API Docs", "http://localhost:4000/api/docs"],
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
  );
}
