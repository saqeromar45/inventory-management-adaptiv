import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, InventoryCount } from "../api";

export default function CountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState<InventoryCount | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => api.getCount(+id!).then(setCount);
  useEffect(() => { load(); }, [id]);

  const updateLine = async (lineId: number, qty: number) => {
    try {
      await api.updateCountLine(+id!, lineId, { counted_quantity: qty });
      load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "خطأ");
    }
  };

  const complete = async () => {
    if (!confirm("هل تريد إكمال الجرد وتطبيق التعديلات على المخزون؟")) return;
    try {
      await api.completeCount(+id!);
      setMsg("تم إكمال الجرد وتطبيق التعديلات");
      load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "خطأ");
    }
  };

  if (!count) return <div>جاري التحميل...</div>;

  const lines = count.lines.filter(
    (l) =>
      !search ||
      l.product_name?.includes(search) ||
      l.product_sku?.includes(search)
  );

  const counted = count.lines.filter((l) => l.counted_quantity !== null && l.counted_quantity !== undefined).length;
  const withVariance = count.lines.filter((l) => l.variance !== null && l.variance !== undefined && l.variance !== 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline" onClick={() => navigate("/counts")} style={{ marginBottom: "0.75rem" }}>← رجوع</button>
          <h2 className="page-title">{count.name}</h2>
          <p className="page-subtitle">تنفيذ الجرد الفعلي وتطبيق الفروقات</p>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes("تم") ? "alert-success" : "alert-error"}`}>{msg}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">المخزن</div>
          <div className="value" style={{ fontSize: "1.2rem" }}>{count.warehouse_name}</div>
        </div>
        <div className="stat-card">
          <div className="label">تم جرده</div>
          <div className="value">{counted} / {count.lines.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">فروقات</div>
          <div className="value" style={{ color: withVariance.length > 0 ? "#c81e1e" : "#057a55" }}>
            {withVariance.length}
          </div>
        </div>
      </div>

      {count.status !== "completed" && (
        <div className="toolbar">
          <input className="search-input" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-success" onClick={complete} disabled={counted < count.lines.length}>
            إكمال الجرد وتطبيق التعديلات
          </button>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>المنتج</th>
              <th>كمية النظام</th>
              <th>الكمية الفعلية</th>
              <th>الفرق</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td>{l.product_sku}</td>
                <td>{l.product_name}</td>
                <td>{l.system_quantity}</td>
                <td>
                  {count.status === "completed" ? (
                    l.counted_quantity
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      style={{ width: 100, padding: "0.375rem", border: "1px solid #e5e7eb", borderRadius: 6 }}
                      defaultValue={l.counted_quantity ?? ""}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateLine(l.id, val);
                      }}
                    />
                  )}
                </td>
                <td>
                  {l.variance !== null && l.variance !== undefined ? (
                    <span className={l.variance > 0 ? "variance-positive" : l.variance < 0 ? "variance-negative" : ""}>
                      {l.variance > 0 ? "+" : ""}{l.variance}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
