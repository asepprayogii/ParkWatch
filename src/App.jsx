import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Lazy Load Pages
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));

const UserFeed = lazy(() => import("./pages/user/UserFeed"));
const UserUpload = lazy(() => import("./pages/user/UserUpload"));
const UserNotifications = lazy(() => import("./pages/user/UserNotifications"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const UserRiwayat = lazy(() => import("./pages/user/UserRiwayat"));
const UserReportDetail = lazy(() => import("./pages/user/UserReportDetail"));

const SatpamDashboard = lazy(() => import("./pages/satpam/SatpamDashboard"));
const SatpamNotifikasi = lazy(() => import("./pages/satpam/SatpamNotifikasi"));
const SatpamJadwal = lazy(() => import("./pages/satpam/SatpamJadwal"));
const SatpamRiwayat = lazy(() => import("./pages/satpam/SatpamRiwayat"));
const SatpamReportDetail = lazy(() => import("./pages/satpam/SatpamReportDetail"));
const SatpamProfil = lazy(() => import("./pages/satpam/SatpamProfil"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLaporan = lazy(() => import("./pages/admin/AdminLaporan"));
const AdminZona = lazy(() => import("./pages/admin/AdminZona"));
const AdminSatpam = lazy(() => import("./pages/admin/AdminSatpam"));
const AdminRoster = lazy(() => import("./pages/admin/AdminRoster"));

// Loading Component for Suspense
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

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
            <img src="/logo.webp" alt="ParkWatch" className="w-full h-full object-contain relative z-10" />
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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <RedirectByRole user={user} /> : <LoginPage />} />
        <Route path="/register" element={user ? <RedirectByRole user={user} /> : <RegisterPage />} />

        {/* User */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="feed" element={<UserFeed />} />
                  <Route path="upload" element={<UserUpload />} />
                  <Route path="notifications" element={<UserNotifications />} />
                  <Route path="riwayat" element={<UserRiwayat />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="report-detail/:id" element={<UserReportDetail />} />
                </Routes>
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Satpam */}
        <Route
          path="/satpam/*"
          element={
            <ProtectedRoute allowedRoles={["satpam"]}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="dashboard" element={<SatpamDashboard />} />
                  <Route path="notifikasi" element={<SatpamNotifikasi />} />
                  <Route path="jadwal" element={<SatpamJadwal />} />
                  <Route path="riwayat" element={<SatpamRiwayat />} />
                  <Route path="report-detail/:id" element={<SatpamReportDetail />} />
                  <Route path="profil" element={<SatpamProfil />} />
                </Routes>
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="laporan" element={<AdminLaporan />} />
                  <Route path="zona" element={<AdminZona />} />
                  <Route path="satpam" element={<AdminSatpam />} />
                  <Route path="roster" element={<AdminRoster />} />
                </Routes>
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={user ? <RedirectByRole user={user} /> : <LandingPage />} />
        <Route path="*" element={user ? <RedirectByRole user={user} /> : <Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
