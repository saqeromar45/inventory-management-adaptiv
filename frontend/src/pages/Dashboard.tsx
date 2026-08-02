import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Movement } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_products: 0,
    total_warehouses: 0,
    total_stock_value: 0,
    low_stock_count: 0,
    pending_counts: 0,
    recent_movements: 0,
  });
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    api.dashboard().then(setStats);
    api.recentMovements().then(setMovements);
  }, []);

  const typeLabel: Record<string, string> = {
    in: "إدخال",
    out: "إخراج",
    transfer: "تحويل",
    adjustment: "تعديل",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">لوحة التحكم</h2>
          <p className="page-subtitle">نظرة عامة على مخزون ADAPTIV</p>
        </div>
        <Link to="/counts" className="btn btn-primary">بدء جرد جديد</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">إجمالي المنتجات</div>
          <div className="value">{stats.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="label">المخازن</div>
          <div className="value">{stats.total_warehouses}</div>
        </div>
        <div className="stat-card">
          <div className="label">قيمة المخزون</div>
          <div className="value">{stats.total_stock_value.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">نواقص المخزون</div>
          <div className="value" style={{ color: stats.low_stock_count > 0 ? "#c81e1e" : undefined }}>
            {stats.low_stock_count}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">جرد قيد التنفيذ</div>
          <div className="value">{stats.pending_counts}</div>
        </div>
        <div className="stat-card">
          <div className="label">حركات (7 أيام)</div>
          <div className="value">{stats.recent_movements}</div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>آخر الحركات</h3>
          <Link to="/movements" className="btn btn-outline">عرض الكل</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>النوع</th>
              <th>الكمية</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{m.product_name}</td>
                <td>
                  <span className={`badge badge-${m.movement_type === "in" ? "in" : m.movement_type === "out" ? "out" : "transfer"}`}>
                    {typeLabel[m.movement_type] || m.movement_type}
                  </span>
                </td>
                <td>{m.quantity}</td>
                <td>{new Date(m.created_at).toLocaleString("ar")}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <strong>لا توجد حركات بعد</strong>
                    ابدأ بإضافة منتج أو تسجيل حركة مخزون
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
