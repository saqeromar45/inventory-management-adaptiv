const API = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "خطأ في الخادم" }));
    throw new Error(err.detail || "خطأ في الخادم");
  }
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string }>("/auth/login/json", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<{ id: number; username: string; full_name: string; role: string }>("/auth/me"),

  dashboard: () =>
    request<{
      total_products: number;
      total_warehouses: number;
      total_stock_value: number;
      low_stock_count: number;
      pending_counts: number;
      recent_movements: number;
    }>("/reports/dashboard"),

  products: (page = 1, search = "") =>
    request<{ items: Product[]; total: number }>(`/products?page=${page}&search=${encodeURIComponent(search)}`),

  createProduct: (data: Partial<Product>) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),

  warehouses: () => request<Warehouse[]>("/warehouses"),

  createWarehouse: (data: Partial<Warehouse>) =>
    request<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(data) }),

  stock: () => request<StockLevel[]>("/warehouses/stock/all"),

  warehouseStock: (id: number) => request<StockLevel[]>(`/warehouses/${id}/stock`),

  movements: (page = 1) =>
    request<{ items: Movement[]; total: number }>(`/movements?page=${page}`),

  createMovement: (data: Partial<Movement>) =>
    request<Movement>("/movements", { method: "POST", body: JSON.stringify(data) }),

  counts: () => request<InventoryCount[]>("/inventory-counts"),

  createCount: (data: { name: string; warehouse_id: number; notes?: string }) =>
    request<InventoryCount>("/inventory-counts", { method: "POST", body: JSON.stringify(data) }),

  getCount: (id: number) => request<InventoryCount>(`/inventory-counts/${id}`),

  startCount: (id: number) =>
    request<InventoryCount>(`/inventory-counts/${id}/start`, { method: "POST" }),

  updateCountLine: (countId: number, lineId: number, data: { counted_quantity: number; notes?: string }) =>
    request(`/inventory-counts/${countId}/lines/${lineId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  completeCount: (id: number) =>
    request<InventoryCount>(`/inventory-counts/${id}/complete?apply_adjustments=true`, { method: "POST" }),

  lowStock: () => request<LowStockItem[]>("/reports/low-stock"),

  variance: (countId: number) => request<VarianceItem[]>(`/reports/variance/${countId}`),

  recentMovements: () => request<Movement[]>("/reports/movements/recent"),

  importExcel: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ created: number; updated: number; errors: string[] }>("/import/excel", {
      method: "POST",
      body: fd,
      headers: {},
    });
  },

  syncOdoo: (config: { url: string; db: string; username: string; password: string }) =>
    request<{ products_synced: number; stock_synced: number; errors: string[] }>("/odoo/sync", {
      method: "POST",
      body: JSON.stringify(config),
    }),
};

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  total_quantity: number;
  is_active: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location?: string;
  is_active: boolean;
}

export interface StockLevel {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
}

export interface Movement {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  product_name?: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  reference?: string;
  created_at: string;
}

export interface InventoryCountLine {
  id: number;
  product_id: number;
  product_sku?: string;
  product_name?: string;
  system_quantity: number;
  counted_quantity?: number;
  variance?: number;
  notes?: string;
}

export interface InventoryCount {
  id: number;
  name: string;
  warehouse_id: number;
  warehouse_name?: string;
  status: string;
  lines: InventoryCountLine[];
  created_at: string;
}

export interface LowStockItem {
  product_id: number;
  sku: string;
  name: string;
  warehouse_name: string;
  quantity: number;
  min_stock: number;
  shortage: number;
}

export interface VarianceItem {
  sku: string;
  name: string;
  system_quantity: number;
  counted_quantity: number;
  variance: number;
  variance_value: number;
}
