import { useEffect, useState } from "react";
import { api, LowStockItem, VarianceItem } from "../api";

export default function Reports() {
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [counts, setCounts] = useState<{ id: number; name: string }[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [variance, setVariance] = useState<VarianceItem[]>([]);

  useEffect(() => {
    api.lowStock().then(setLowStock);
    api.counts().then((c) => {
      const completed = c.filter((x) => x.status === "completed");
      setCounts(completed.map((x) => ({ id: x.id, name: x.name })));
      if (completed.length > 0) setSelectedCount(completed[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedCount) api.variance(selectedCount).then(setVariance);
  }, [selectedCount]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">التقارير</h2>
          <p className="page-subtitle">نواقص المخزون وفروقات الجرد</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">تقرير النواقص (تحت الحد الأدنى)</h3>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>المنتج</th>
              <th>المخزن</th>
              <th>الكمية الحالية</th>
              <th>الحد الأدنى</th>
              <th>النقص</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((item, i) => (
              <tr key={i}>
                <td>{item.sku}</td>
                <td>{item.name}</td>
                <td>{item.warehouse_name}</td>
                <td style={{ color: "#c81e1e", fontWeight: 600 }}>{item.quantity}</td>
                <td>{item.min_stock}</td>
                <td style={{ color: "#c81e1e" }}>{item.shortage}</td>
              </tr>
            ))}
            {lowStock.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "#057a55" }}>لا توجد نواقص 🎉</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="toolbar">
          <h3>تقرير فروقات الجرد</h3>
          {counts.length > 0 && (
            <select
              className="search-input"
              value={selectedCount}
              onChange={(e) => setSelectedCount(+e.target.value)}
            >
              {counts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        {counts.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>لا توجد عمليات جرد مكتملة</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>المنتج</th>
                <th>كمية النظام</th>
                <th>الكمية الفعلية</th>
                <th>الفرق</th>
                <th>قيمة الفرق</th>
              </tr>
            </thead>
            <tbody>
              {variance.map((v, i) => (
                <tr key={i}>
                  <td>{v.sku}</td>
                  <td>{v.name}</td>
                  <td>{v.system_quantity}</td>
                  <td>{v.counted_quantity}</td>
                  <td className={v.variance > 0 ? "variance-positive" : "variance-negative"}>
                    {v.variance > 0 ? "+" : ""}{v.variance}
                  </td>
                  <td>{v.variance_value.toFixed(2)}</td>
                </tr>
              ))}
              {variance.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#057a55" }}>لا توجد فروقات</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
