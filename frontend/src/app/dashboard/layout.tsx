"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Store,
  Users,
  Undo2,
  Webhook,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  Zap,
} from "lucide-react";

const navItems = [
  { section: "Overview", items: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  ]},
  { section: "Payments", items: [
    { href: "/dashboard/transactions", icon: ArrowLeftRight, label: "Transactions" },
    { href: "/dashboard/refunds", icon: Undo2, label: "Refunds" },
    { href: "/dashboard/payment-methods", icon: CreditCard, label: "Payment Methods" },
  ]},
  { section: "Management", items: [
    { href: "/dashboard/merchants", icon: Store, label: "Merchants" },
    { href: "/dashboard/customers", icon: Users, label: "Customers" },
    { href: "/dashboard/webhooks", icon: Webhook, label: "Webhooks" },
  ]},
  { section: "Insights", items: [
    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ]},
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("pgd_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("pgd_token");
    router.push("/login");
  };

  if (!mounted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="skeleton" style={{ width: 200, height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">PG</div>
          <div>
            <div className="logo-text">PGD</div>
            <span className="logo-badge">DUMMY</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                >
                  <span className="link-icon">
                    <item.icon size={18} />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid var(--border-subtle)" }}>
          <div className="live-indicator" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
            <span className="live-dot" />
            <Zap size={12} />
            Simulator Active
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: "100%", cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", fontSize: 14 }}
          >
            <span className="link-icon"><LogOut size={18} /></span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
