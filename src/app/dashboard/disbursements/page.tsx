"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Send, X, Landmark, Wallet, Clock, CheckCircle, XCircle, AlertCircle, RefreshCcw } from "lucide-react";
import { disbursementsApi, merchantsApi } from "@/lib/api";
import { formatCurrency, formatDateShort, formatDate, getStatusBadgeClass } from "@/lib/utils";
import TransactionFilterPopover, { FilterValues } from "@/components/ui/TransactionFilterPopover";

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

const statusTimeline = [
  { key: "pending", label: "Created", icon: Clock },
  { key: "processing", label: "Processing", icon: AlertCircle },
  { key: "success", label: "Completed", icon: CheckCircle },
];

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search State
  const [search, setSearch] = useState("");

  // Filter Values State
  const [filterValues, setFilterValues] = useState<FilterValues>({
    statuses: [],
    merchants: [],
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });

  const [merchantsList, setMerchantsList] = useState<Merchant[]>([]);

  // Create Modal State
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

  // Detail Modal State
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const [detailDb, setDetailDb] = useState<Disbursement | null>(null);
  const [loadingDetailDb, setLoadingDetailDb] = useState(false);

  // Custom Ref IDs (Optional override)
  const [customRefs, setCustomRefs] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [issuerOrderId, setIssuerOrderId] = useState("");
  const [refId, setRefId] = useState("");
  const [merchantRefId, setMerchantRefId] = useState("");

  // Close modal on Escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDbId(null);
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRowClick = async (id: string) => {
    setSelectedDbId(id);
    setLoadingDetailDb(true);
    setDetailDb(null);
    try {
      const res = await disbursementsApi.get(id);
      setDetailDb(res.data.data);
    } catch (err) {
      console.error("Failed to load disbursement details:", err);
    } finally {
      setLoadingDetailDb(false);
    }
  };

  const isFailedDb = detailDb ? (detailDb.status === "failed" || detailDb.status === "rejected") : false;
  const currentDbStep = detailDb ? (isFailedDb ? 2 : ["pending", "processing", "success"].indexOf(detailDb.status)) : 0;


  // Load merchants list on mount
  useEffect(() => {
    merchantsApi.list({ limit: 100 }).then((res) => {
      const list = res.data.data?.data || [];
      setMerchantsList(list);
    }).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 15, sortBy: "createdAt", sortOrder: "DESC" };
      if (filterValues.statuses.length > 0) params.status = filterValues.statuses.join(",");
      if (search) params.search = search;
      if (filterValues.startDate) params.startDate = filterValues.startDate;
      if (filterValues.endDate) params.endDate = filterValues.endDate;
      if (filterValues.minAmount) params.minAmount = Number(filterValues.minAmount);
      if (filterValues.maxAmount) params.maxAmount = Number(filterValues.maxAmount);
      if (filterValues.merchants.length > 0) {
        params.merchantIds = filterValues.merchants.map((m) => m.id).join(",");
      }
      const res = await disbursementsApi.list(params);
      const list = res.data?.data?.data || (Array.isArray(res.data?.data) ? res.data.data : []);
      setDisbursements(Array.isArray(list) ? list : []);
      setTotalPages(res.data?.data?.meta?.totalPages || res.data?.meta?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch disbursements:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues]);

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
        {/* Reusable Filter Popover Component */}
        <TransactionFilterPopover
          title="Disbursement Filter"
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          filterValues={filterValues}
          merchantsList={merchantsList}
          onApply={(newValues) => {
            setFilterValues(newValues);
            setPage(1);
          }}
          onReset={() => {
            setFilterValues({
              statuses: [],
              merchants: [],
              startDate: "",
              endDate: "",
              minAmount: "",
              maxAmount: "",
            });
            setPage(1);
          }}
        />


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
                  <tr key={db.id} onClick={() => handleRowClick(db.id)} style={{ cursor: "pointer" }}>
                    <td>
                      <span style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: 13 }}>
                        {db.orderId}
                      </span>
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
            
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>New Disbursement</h2>

            <form onSubmit={handleCreateDisbursement} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="label">Select Merchant *</label>
                <select className="input" value={selectedMerchant} onChange={(e) => setSelectedMerchant(e.target.value)}>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Amount (IDR) *</label>
                <input type="number" className="input" placeholder="e.g. 100000" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="any" required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Channel Type</label>
                  <select className="input" value={channelType} onChange={(e) => setChannelType(e.target.value)}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="e_wallet">E-Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="label">Channel</label>
                  <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
                    {channelType === "bank_transfer" ? (
                      <>
                        <option value="MANDIRI">Mandiri</option>
                        <option value="BCA">BCA</option>
                        <option value="BNI">BNI</option>
                        <option value="BRI">BRI</option>
                      </>
                    ) : (
                      <>
                        <option value="GOPAY">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="DANA">DANA</option>
                        <option value="SHOPEEPAY">ShopeePay</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Recipient Account Number *</label>
                <input type="text" className="input" placeholder="Account Number or Phone" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} required />
              </div>

              <div>
                <label className="label">Recipient Name *</label>
                <input type="text" className="input" placeholder="Account Holder Name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
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

      {/* Disbursement Detail Modal */}
      {selectedDbId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div 
            className="glass-card" 
            style={{ 
              width: "95%", maxWidth: "1300px", minHeight: "75vh", maxHeight: "92vh", 
              overflowY: "auto", padding: 36, position: "relative",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(99, 102, 241, 0.15)"
            }}
          >
            <button onClick={() => setSelectedDbId(null)} style={{ position: "absolute", top: 24, right: 24, border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={22} />
            </button>


            {loadingDetailDb || !detailDb ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="skeleton" style={{ height: 32, width: 300 }} />
                <div className="skeleton" style={{ height: 60 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="skeleton" style={{ height: 150 }} />
                  <div className="skeleton" style={{ height: 150 }} />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, margin: 0 }}>{detailDb.orderId}</h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Disbursement Details</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(detailDb.status)}`} style={{ fontSize: 14 }}>{detailDb.status}</span>
                </div>

                {/* Status Timeline */}
                <div style={{ background: "var(--bg-card)", padding: "20px 32px", borderRadius: 12, marginBottom: 28 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, marginTop: 0, textAlign: "center", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    STATUS TIMELINE
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: 650, margin: "0 auto" }}>
                    {[
                      { key: "pending", label: "Pending", icon: Clock },
                      { key: "processing", label: "Processing", icon: RefreshCcw },
                      { key: "success", label: "Success", icon: CheckCircle }
                    ].map((step, i) => {
                      const isActive = i <= currentDbStep;
                      const Icon = isFailedDb && i === 2 ? XCircle : step.icon;
                      return (
                        <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: "50%",
                              background: isActive ? (isFailedDb && i === 2 ? "var(--status-failed-bg)" : "var(--status-success-bg)") : "#0f172a",
                              border: `2px solid ${isActive ? (isFailedDb && i === 2 ? "var(--status-failed)" : "var(--status-success)") : "var(--border-subtle)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: isActive ? (isFailedDb && i === 2 ? "var(--status-failed)" : "var(--status-success)") : "var(--text-muted)",
                              boxShadow: isActive ? `0 0 14px ${isFailedDb && i === 2 ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.3)"}` : "none"
                            }}>
                              <Icon size={18} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {isFailedDb && i === 2 ? "Failed" : step.label}
                            </span>
                          </div>

                          {i < 2 && (
                            <div style={{
                              flex: 1, height: 3, margin: "0 16px", marginTop: -24,
                              background: i < currentDbStep ? "var(--gradient-primary)" : "var(--border-subtle)",
                              borderRadius: 2
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>


                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {/* Disbursement Info */}
                  <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>Disbursement Information</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        ["Amount", formatCurrency(detailDb.amount, detailDb.currency)],
                        ["Fee", formatCurrency(detailDb.fee || 0, detailDb.currency)],
                        ["Net Amount", formatCurrency(detailDb.netAmount || detailDb.amount, detailDb.currency)],
                        ["Currency", detailDb.currency],
                        ["Channel Type", detailDb.channelType],
                        ["Channel", detailDb.channel],
                        ["Recipient Account", detailDb.recipientAccount],
                        ["Recipient Name", detailDb.recipientName],
                        ["Description", detailDb.description || "—"],
                      ].map(([label, value]) => (
                        <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Merchant & References */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>Parties</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                          ["Merchant", detailDb.merchant?.name || "—"],
                          ["Created", formatDate(detailDb.createdAt)],
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
                          ["Order ID", detailDb.orderId],
                          ["Issuer Order ID", detailDb.issuerOrderId || "—"],
                          ["Ref ID", detailDb.refId || "—"],
                          ["Merchant Ref ID", detailDb.merchantRefId || "—"],
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
