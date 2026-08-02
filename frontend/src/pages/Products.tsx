import { useEffect, useState } from "react";
import { api, Product } from "../api";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", unit: "قطعة", cost_price: 0, sale_price: 0, min_stock: 0 });
  const [msg, setMsg] = useState("");

  const load = () => api.products(1, search).then((r) => setProducts(r.items));
  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct(form);
      setShowForm(false);
      setForm({ sku: "", name: "", unit: "قطعة", cost_price: 0, sale_price: 0, min_stock: 0 });
      setMsg("تم إضافة المنتج بنجاح");
      load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "خطأ");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">المنتجات</h2>
          <p className="page-subtitle">إدارة أصناف ADAPTIV وتفاصيلها</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "إلغاء" : "+ منتج جديد"}
        </button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="toolbar">
        <input className="search-input" placeholder="بحث بالاسم أو الكود..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>رمز المنتج (SKU)</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>اسم المنتج</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>الوحدة</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="form-group">
                <label>سعر التكلفة</label>
                <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>سعر البيع</label>
                <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>حد أدنى للمخزون</label>
                <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: +e.target.value })} />
              </div>
            </div>
            <button className="btn btn-success" type="submit">حفظ</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>الاسم</th>
              <th>الوحدة</th>
              <th>الكمية الإجمالية</th>
              <th>حد أدنى</th>
              <th>سعر التكلفة</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.unit}</td>
                <td style={{ fontWeight: 600, color: p.total_quantity < p.min_stock ? "#c81e1e" : undefined }}>
                  {p.total_quantity}
                </td>
                <td>{p.min_stock}</td>
                <td>{p.cost_price}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <strong>لا توجد منتجات</strong>
                    أضف منتجاً جديداً أو استورد من Excel / Odoo
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
