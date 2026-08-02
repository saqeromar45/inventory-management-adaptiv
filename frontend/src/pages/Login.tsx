import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import BrandLogo from "../components/BrandLogo";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { access_token } = await api.login(username, password);
      localStorage.setItem("token", access_token);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <BrandLogo className="brand-logo--login" />
        <p className="login-subtitle">IMS-ADAPTIV — نظام إدارة المخزون والجرد</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }} disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
          admin / admin123 — warehouse / warehouse123
        </p>
      </div>
    </div>
  );
}
