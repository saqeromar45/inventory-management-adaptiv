import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, InventoryCount, Warehouse } from "../api";

export default function Counts() {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", warehouse_id: 0, notes: "" });

  const load = () => api.counts().then(setCounts);
  useEffect(() => {
    load();
    api.warehouses().then(setWarehouses);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createCount(form);
    setShowForm(false);
    setForm({ name: "", warehouse_id: 0, notes: "" });
    load();
  };

  const statusLabel: Record<string, string> = {
    draft: "مسودة",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
  };

  const statusBadge: Record<string, string> = {
    draft: "badge-draft",
    in_progress: "badge-progress",
    completed: "badge-completed",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">عمليات الجرد</h2>
          <p className="page-subtitle">مقارنة الكمية الفعلية مع رصيد النظام</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "إلغاء" : "+ جرد جديد"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>اسم عملية الجرد</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="مثال: جرد ربع سنوي Q1" />
              </div>
              <div className="form-group">
                <label>المخزن</label>
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: +e.target.value })} required>
                  <option value={0}>اختر مخزن</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-success" type="submit">إنشاء عملية الجرد</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المخزن</th>
              <th>الحالة</th>
              <th>عدد المنتجات</th>
              <th>التاريخ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {counts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.warehouse_name}</td>
                <td><span className={`badge ${statusBadge[c.status]}`}>{statusLabel[c.status]}</span></td>
                <td>{c.lines.length}</td>
                <td>{new Date(c.created_at).toLocaleDateString("ar")}</td>
                <td>
                  <Link to={`/counts/${c.id}`} className="btn btn-outline">
                    {c.status === "completed" ? "عرض" : "تنفيذ الجرد"}
                  </Link>
                </td>
              </tr>
            ))}
            {counts.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af" }}>لا توجد عمليات جرد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
