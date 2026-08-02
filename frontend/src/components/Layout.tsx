import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import BrandLogo from "./BrandLogo";

export default function Layout() {
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.me().then(setUser).catch(() => navigate("/login"));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const links = [
    { to: "/", label: "لوحة التحكم" },
    { to: "/products", label: "المنتجات" },
    { to: "/stock", label: "المخزون" },
    { to: "/movements", label: "حركات المخزون" },
    { to: "/counts", label: "الجرد" },
    { to: "/reports", label: "التقارير" },
    { to: "/import", label: "استيراد / Odoo" },
  ];

  const roleLabel: Record<string, string> = {
    admin: "مدير",
    warehouse_keeper: "أمين مخزن",
    viewer: "مشاهد",
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrandLogo className="brand-logo--sidebar" />
          <div className="brand-subtitle">IMS-ADAPTIV — نظام إدارة المخزون والجرد</div>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-info">
          {user && (
            <div className="user-name">
              {user.full_name}
              <div style={{ color: "#a8a29e", fontWeight: 400, fontSize: "0.78rem", marginTop: 2 }}>
                {roleLabel[user.role] || user.role}
              </div>
            </div>
          )}
          <button className="btn btn-outline" style={{ width: "100%" }} onClick={logout}>
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
