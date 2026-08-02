import { useEffect, useState } from "react";
import { api, Movement, Product, Warehouse } from "../api";

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    product_id: 0,
    movement_type: "in",
    quantity: 1,
    from_warehouse_id: 0,
    to_warehouse_id: 0,
    reference: "",
    notes: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.movements().then((r) => setMovements(r.items));
    api.products().then((r) => setProducts(r.items));
    api.warehouses().then(setWarehouses);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        product_id: form.product_id,
        movement_type: form.movement_type,
        quantity: form.quantity,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      };
      if (form.movement_type === "in") payload.to_warehouse_id = form.to_warehouse_id;
      if (form.movement_type === "out") payload.from_warehouse_id = form.from_warehouse_id;
      if (form.movement_type === "transfer") {
        payload.from_warehouse_id = form.from_warehouse_id;
        payload.to_warehouse_id = form.to_warehouse_id;
      }
      await api.createMovement(payload);
      setMsg("تم تسجيل الحركة بنجاح");
      setShowForm(false);
      api.movements().then((r) => setMovements(r.items));
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "خطأ");
    }
  };

  const typeLabel: Record<string, string> = { in: "إدخال", out: "إخراج", transfer: "تحويل", adjustment: "تعديل" };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">حركات المخزون</h2>
          <p className="page-subtitle">إدخال، إخراج، وتحويل بين المخازن</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "إلغاء" : "+ حركة جديدة"}
        </button>
      </div>
      {msg && <div className={`alert ${msg.includes("نجاح") ? "alert-success" : "alert-error"}`}>{msg}</div>}

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>المنتج</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: +e.target.value })} required>
                  <option value={0}>اختر منتج</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>نوع الحركة</label>
                <select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}>
                  <option value="in">إدخال</option>
                  <option value="out">إخراج</option>
                  <option value="transfer">تحويل بين مخازن</option>
                </select>
              </div>
              <div className="form-group">
                <label>الكمية</label>
                <input type="number" min={0.01} step={0.01} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} required />
              </div>
              {(form.movement_type === "out" || form.movement_type === "transfer") && (
                <div className="form-group">
                  <label>من مخزن</label>
                  <select value={form.from_warehouse_id} onChange={(e) => setForm({ ...form, from_warehouse_id: +e.target.value })} required>
                    <option value={0}>اختر</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              {(form.movement_type === "in" || form.movement_type === "transfer") && (
                <div className="form-group">
                  <label>إلى مخزن</label>
                  <select value={form.to_warehouse_id} onChange={(e) => setForm({ ...form, to_warehouse_id: +e.target.value })} required>
                    <option value={0}>اختر</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>مرجع</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-success" type="submit">تسجيل</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>النوع</th>
              <th>الكمية</th>
              <th>من</th>
              <th>إلى</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{m.product_name}</td>
                <td>{typeLabel[m.movement_type]}</td>
                <td>{m.quantity}</td>
                <td>{m.from_warehouse_name || "—"}</td>
                <td>{m.to_warehouse_name || "—"}</td>
                <td>{new Date(m.created_at).toLocaleString("ar")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
