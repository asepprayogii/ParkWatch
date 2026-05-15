import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import UserFeed from "./pages/user/UserFeed";
import UserUpload from "./pages/user/UserUpload";
import UserNotifications from "./pages/user/UserNotifications";
import UserProfile from "./pages/user/UserProfile";
import UserRiwayat from "./pages/user/UserRiwayat";
import UserReportDetail from "./pages/user/UserReportDetail";

import SatpamDashboard from "./pages/satpam/SatpamDashboard";
import SatpamNotifikasi from "./pages/satpam/SatpamNotifikasi";
import SatpamJadwal from "./pages/satpam/SatpamJadwal";
import SatpamRiwayat from "./pages/satpam/SatpamRiwayat";
import SatpamReportDetail from "./pages/satpam/SatpamReportDetail";
import SatpamProfil from "./pages/satpam/SatpamProfil";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLaporan from "./pages/admin/AdminLaporan";
import AdminZona from "./pages/admin/AdminZona";
import AdminSatpam from "./pages/admin/AdminSatpam";
import AdminRoster from "./pages/admin/AdminRoster";

function RedirectByRole({ user }) {
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "satpam") return <Navigate to="/satpam/dashboard" replace />;
  return <Navigate to="/user/feed" replace />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
        <div className="relative">
          {/* Logo Animation */}
          <div className="w-20 h-20 mb-8 relative">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-20 animate-pulse" />
            <img src="/logo.png" alt="ParkWatch" className="w-full h-full object-contain relative z-10" />
          </div>
          
          {/* Loading Spinner */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em]">Memuat Sistem</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <RedirectByRole user={user} /> : <LoginPage />} />
      <Route path="/register" element={user ? <RedirectByRole user={user} /> : <RegisterPage />} />

      {/* User */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Routes>
              <Route path="feed" element={<UserFeed />} />
              <Route path="upload" element={<UserUpload />} />
              <Route path="notifications" element={<UserNotifications />} />
              <Route path="riwayat" element={<UserRiwayat />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="report-detail/:id" element={<UserReportDetail />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Satpam */}
      <Route
        path="/satpam/*"
        element={
          <ProtectedRoute allowedRoles={["satpam"]}>
            <Routes>
              <Route path="dashboard" element={<SatpamDashboard />} />
              <Route path="notifikasi" element={<SatpamNotifikasi />} />
              <Route path="jadwal" element={<SatpamJadwal />} />
              <Route path="riwayat" element={<SatpamRiwayat />} />
              <Route path="report-detail/:id" element={<SatpamReportDetail />} />
              <Route path="profil" element={<SatpamProfil />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="laporan" element={<AdminLaporan />} />
              <Route path="zona" element={<AdminZona />} />
              <Route path="satpam" element={<AdminSatpam />} />
              <Route path="roster" element={<AdminRoster />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="/" element={user ? <RedirectByRole user={user} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={user ? <RedirectByRole user={user} /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
