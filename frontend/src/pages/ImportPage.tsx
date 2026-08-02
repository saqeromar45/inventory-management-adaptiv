import { useState } from "react";
import { api } from "../api";

export default function ImportPage() {
  const [excelResult, setExcelResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [odooResult, setOdooResult] = useState<{ products_synced: number; stock_synced: number; errors: string[] } | null>(null);
  const [odoo, setOdoo] = useState({ url: "", db: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.importExcel(file);
      setExcelResult(result);
    } catch (err: unknown) {
      setExcelResult({ created: 0, updated: 0, errors: [err instanceof Error ? err.message : "خطأ"] });
    } finally {
      setLoading(false);
    }
  };

  const handleOdoo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.syncOdoo(odoo);
      setOdooResult(result);
    } catch (err: unknown) {
      setOdooResult({ products_synced: 0, stock_synced: 0, errors: [err instanceof Error ? err.message : "خطأ"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">استيراد البيانات</h2>
          <p className="page-subtitle">جلب المنتجات والكميات من Excel أو Odoo</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">استيراد من Excel / CSV</h3>
        <p className="page-subtitle" style={{ marginBottom: "1rem" }}>
          يدعم الأعمدة: SKU، اسم المنتج، باركود، وحدة، تصنيف، سعر التكلفة، سعر البيع، كمية، مخزن
        </p>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcel} disabled={loading} />
        {excelResult && (
          <div style={{ marginTop: "1rem" }}>
            <div className="alert alert-success">
              تم إنشاء {excelResult.created} منتج | تحديث {excelResult.updated} منتج
            </div>
            {excelResult.errors.length > 0 && (
              <div className="alert alert-error">
                {excelResult.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">مزامنة Odoo</h3>
        <form onSubmit={handleOdoo}>
          <div className="form-row">
            <div className="form-group">
              <label>رابط Odoo</label>
              <input value={odoo.url} onChange={(e) => setOdoo({ ...odoo, url: e.target.value })} placeholder="https://your-company.odoo.com" required />
            </div>
            <div className="form-group">
              <label>قاعدة البيانات</label>
              <input value={odoo.db} onChange={(e) => setOdoo({ ...odoo, db: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>اسم المستخدم</label>
              <input value={odoo.username} onChange={(e) => setOdoo({ ...odoo, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>كلمة المرور</label>
              <input type="password" value={odoo.password} onChange={(e) => setOdoo({ ...odoo, password: e.target.value })} required />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "جاري المزامنة..." : "مزامنة المنتجات والمخزون"}
          </button>
        </form>
        {odooResult && (
          <div style={{ marginTop: "1rem" }}>
            <div className="alert alert-success">
              تم مزامنة {odooResult.products_synced} منتج | {odooResult.stock_synced} رصيد مخزون
            </div>
            {odooResult.errors.length > 0 && (
              <div className="alert alert-error">
                {odooResult.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
