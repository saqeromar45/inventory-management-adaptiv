import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import Movements from "./pages/Movements";
import Counts from "./pages/Counts";
import CountDetail from "./pages/CountDetail";
import Reports from "./pages/Reports";
import ImportPage from "./pages/ImportPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="stock" element={<Stock />} />
        <Route path="movements" element={<Movements />} />
        <Route path="counts" element={<Counts />} />
        <Route path="counts/:id" element={<CountDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="import" element={<ImportPage />} />
      </Route>
    </Routes>
  );
}
