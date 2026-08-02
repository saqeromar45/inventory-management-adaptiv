import { useEffect, useState } from "react";
import { api, StockLevel, Warehouse } from "../api";

export default function Stock() {
  const [stock, setStock] = useState<StockLevel[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<number | "all">("all");

  useEffect(() => {
    api.warehouses().then(setWarehouses);
  }, []);

  useEffect(() => {
    if (selectedWh === "all") {
      api.stock().then(setStock);
    } else {
      api.warehouseStock(selectedWh).then(setStock);
    }
  }, [selectedWh]);

  const totalQty = stock.reduce((s, l) => s + l.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">المخزون الحالي</h2>
          <p className="page-subtitle">الكميات المتوفرة حسب المخزن</p>
        </div>
        <span className="badge badge-progress" style={{ fontSize: "0.9rem", padding: "0.5rem 0.9rem" }}>
          إجمالي الكميات: {totalQty}
        </span>
      </div>
      <div className="toolbar">
        <select
          className="search-input"
          value={selectedWh}
          onChange={(e) => setSelectedWh(e.target.value === "all" ? "all" : +e.target.value)}
        >
          <option value="all">جميع المخازن</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>المنتج</th>
              <th>المخزن</th>
              <th>الكمية</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.id}>
                <td>{s.product_sku}</td>
                <td>{s.product_name}</td>
                <td>{s.warehouse_name}</td>
                <td style={{ fontWeight: 700, fontSize: "1.1rem" }}>{s.quantity}</td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <strong>لا يوجد مخزون</strong>
                    سجّل حركة إدخال أو استورد الكميات من Excel
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
