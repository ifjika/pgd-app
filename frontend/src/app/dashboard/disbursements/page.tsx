"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Send, X, Landmark, Wallet } from "lucide-react";
import { disbursementsApi, merchantsApi } from "@/lib/api";
import { formatCurrency, formatDateShort, getStatusBadgeClass } from "@/lib/utils";

interface Merchant {
  id: string;
  name: string;
}

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
  createdAt: string;
  merchant?: { name: string };
}

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [channelType, setChannelType] = useState("bank_transfer");
  const [channel, setChannel] = useState("MANDIRI");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Custom Ref IDs (Optional override)
  const [customRefs, setCustomRefs] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [issuerOrderId, setIssuerOrderId] = useState("");
  const [refId, setRefId] = useState("");
  const [merchantRefId, setMerchantRefId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 15, sortBy: "createdAt", sortOrder: "DESC" };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await disbursementsApi.list(params);
      const list = res.data?.data?.data || (Array.isArray(res.data?.data) ? res.data.data : []);
      setDisbursements(Array.isArray(list) ? list : []);
      setTotalPages(res.data?.data?.meta?.totalPages || res.data?.meta?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch disbursements:", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Load merchants for the creation form
  useEffect(() => {
    if (isModalOpen) {
      merchantsApi.list({ limit: 100 }).then((res) => {
        const list = res.data.data?.data || [];
        setMerchants(list);
        if (list.length > 0) setSelectedMerchant(list[0].id);
      }).catch(err => console.error("Error loading merchants:", err));
      
      // Auto-generate temporary custom refs in state
      const rand = () => Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = Date.now();
      setOrderId(`DIS-${now}-${rand()}`);
      setIssuerOrderId(`ISS-${now}-${rand()}`);
      setRefId(`REF-${now}-${rand()}`);
      setMerchantRefId(`MREF-${now}-${rand()}`);
    }
  }, [isModalOpen]);

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !amount || !recipientAccount || !recipientName) {
      alert("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        merchantId: selectedMerchant,
        amount: parseFloat(amount),
        channelType,
        channel,
        recipientAccount,
        recipientName,
        description,
        currency: "IDR",
      };

      if (customRefs) {
        payload.orderId = orderId;
        payload.issuerOrderId = issuerOrderId;
        payload.refId = refId;
        payload.merchantRefId = merchantRefId;
      }

      await disbursementsApi.create(payload);
      setIsModalOpen(false);
      // Reset form
      setAmount("");
      setRecipientAccount("");
      setRecipientName("");
      setDescription("");
      setCustomRefs(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create disbursement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Disbursements</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New Disbursement
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div className="input-group" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={16} className="input-icon" />
            <input className="input" placeholder="Search disbursements..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" style={{ width: 180 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Disbursement ID</th>
                <th>Merchant</th>
                <th>Recipient</th>
                <th>Channel</th>
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
              ) : disbursements.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h3>No disbursements found</h3></div></td></tr>
              ) : (
                disbursements.map((db) => (
                  <tr key={db.id} style={{ cursor: "pointer" }}>
                    <td>
                      <Link href={`/dashboard/disbursements/${db.id}`} style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
                        {db.orderId}
                      </Link>
                    </td>
                    <td>{db.merchant?.name || "—"}</td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      <div>{db.recipientName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{db.recipientAccount}</div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        {db.channelType === "bank_transfer" ? <Landmark size={12} /> : <Wallet size={12} />}
                        {db.channel}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(db.amount, db.currency)}</td>
                    <td><span className={`badge ${getStatusBadgeClass(db.status)}`}>{db.status}</span></td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDateShort(db.createdAt)}</td>
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

      {/* Modal dialog for creating new disbursement */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: 500, padding: 24, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Send size={18} className="text-primary" />
              New Disbursement Flow
            </h2>

            <form onSubmit={handleCreateDisbursement} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Merchant *</label>
                <select className="input" value={selectedMerchant} onChange={(e) => setSelectedMerchant(e.target.value)}>
                  {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Amount (IDR) *</label>
                <input type="number" className="input" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Channel Type *</label>
                  <select className="input" value={channelType} onChange={(e) => {
                    setChannelType(e.target.value);
                    setChannel(e.target.value === "bank_transfer" ? "MANDIRI" : "DANA");
                  }}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="e_wallet">E-Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="label">Channel *</label>
                  {channelType === "bank_transfer" ? (
                    <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
                      <option value="MANDIRI">MANDIRI</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BCA">BCA</option>
                      <option value="CIMB">CIMB</option>
                    </select>
                  ) : (
                    <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Recipient Account / Phone *</label>
                  <input type="text" className="input" placeholder="e.g. 123456789 or phone" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Recipient Name *</label>
                  <input type="text" className="input" placeholder="e.g. Alice Santoso" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <input type="text" className="input" placeholder="Disbursement description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              {/* Reference IDs Toggle */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: "var(--text-primary)", fontWeight: 500 }}>
                  <input type="checkbox" checked={customRefs} onChange={(e) => setCustomRefs(e.target.checked)} />
                  Customize Reference IDs (orderId, issuerOrderId, refId, merchantRefId)
                </label>
              </div>

              {customRefs && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-card)", padding: 12, borderRadius: 8 }}>
                  <div>
                    <label className="label" style={{ fontSize: 11 }}>Order ID</label>
                    <input type="text" className="input" style={{ height: 32, fontSize: 12 }} value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11 }}>Issuer Order ID</label>
                    <input type="text" className="input" style={{ height: 32, fontSize: 12 }} value={issuerOrderId} onChange={(e) => setIssuerOrderId(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11 }}>Ref ID</label>
                    <input type="text" className="input" style={{ height: 32, fontSize: 12 }} value={refId} onChange={(e) => setRefId(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11 }}>Merchant Ref ID</label>
                    <input type="text" className="input" style={{ height: 32, fontSize: 12 }} value={merchantRefId} onChange={(e) => setMerchantRefId(e.target.value)} />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Disbursement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
