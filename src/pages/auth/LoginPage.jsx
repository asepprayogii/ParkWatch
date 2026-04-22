import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/auth";
import { useAuth } from "../../store/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
      />
    </svg>
  );

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      // Ambil profile + role dari tabel users
      const { getCurrentUser } = await import("../../services/auth");
      const profile = await getCurrentUser();
      if (profile.role === "admin") navigate("/admin/dashboard");
      else if (profile.role === "satpam") navigate("/satpam/dashboard");
      else navigate("/user/feed");
    } catch (err) {
      setError(err.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <ShieldIcon />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">ParkWatch</h1>
          <p className="text-slate-500 mt-1 text-sm">Sistem Keamanan Komunitas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">Masuk ke Akun</h2>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contoh@email.com" required />

            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              required
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center">
                  <EyeIcon open={showPassword} />
                </button>
              }
            />

            <div className="pt-1">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </div>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-3 text-sm text-slate-400">atau</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">ParkWatch © 2026 · TechSprint Web Development</p>
      </div>
    </div>
  );
}
