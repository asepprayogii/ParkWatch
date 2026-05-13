// src/pages/user/UserUpload.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { createReportWithNotification, uploadPhoto, getZones } from "../../services/reports";
import { detectPlateWithAPI, validateIndonesianPlate } from "../../services/plateDetection";
import UserLayout from "../../components/layout/UserLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Image, X, CheckCircle, AlertCircle, ZoomIn, 
  MapPin, FileText, ChevronDown, Ruler, Eye, Sun, AlignLeft 
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function UserUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    plate_number: "",
    zone_id: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectionError, setDetectionError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCameraTips, setShowCameraTips] = useState(false);

  useEffect(() => {
    getZones().then(setZones).catch(console.error);
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhoto = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setDetectionError("");
    setForm((f) => ({ ...f, plate_number: "" }));

    setDetecting(true);
    setDetectionProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setDetectionProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const plateNumber = await detectPlateWithAPI(file);
      
      clearInterval(progressInterval);
      setDetectionProgress(100);

      if (plateNumber) {
        setForm((f) => ({ ...f, plate_number: plateNumber }));
        setTimeout(() => {
          setDetecting(false);
          setDetectionProgress(0);
        }, 500);
      } else {
        setDetectionError("Plat tidak terdeteksi. Silakan masukkan manual.");
        setDetecting(false);
        setDetectionProgress(0);
      }
    } catch (err) {
      console.error(err);
      setDetectionError("Gagal mendeteksi plat. Silakan masukkan manual.");
      setDetecting(false);
      setDetectionProgress(0);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePhoto(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCameraClick = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (err) {
        setShowCameraTips(true);
        return;
      }
    }
    fileRef.current?.click();
  };

  const handleGalleryClick = () => {
    const input = fileRef.current;
    if (input) {
      const originalCapture = input.getAttribute("capture");
      input.removeAttribute("capture");
      input.click();
      setTimeout(() => {
        if (originalCapture) input.setAttribute("capture", originalCapture);
      }, 100);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    setDetectionError("");
    setForm((f) => ({ ...f, plate_number: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError("Foto kendaraan wajib diupload");
      return;
    }
    if (!form.plate_number) {
      setError("Nomor plat wajib diisi");
      return;
    }
    if (!form.zone_id) {
      setError("Pilih zona parkir");
      return;
    }

    const validatedPlate = validateIndonesianPlate(form.plate_number);
    if (!validatedPlate) {
      setError("Format plat nomor tidak valid. Contoh: B 1234 ABC");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const photo_url = await uploadPhoto(photo, user.id);
      
      const report = await createReportWithNotification({
        user_id: user.id,
        plate_number: validatedPlate.toUpperCase(),
        zone_id: form.zone_id,
        photo_url,
        description: form.description,
      });

      navigate("/user/feed");
    } catch (err) {
      setError(err.message || "Gagal mengirim laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout title="Laporkan Parkir Liar">
      <form onSubmit={handleSubmit} className="py-3 space-y-5">
        
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button 
                type="button"
                onClick={() => setError("")} 
                className="text-red-400 hover:text-red-600 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📸 Upload Foto Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Foto Kendaraan <span className="text-red-500">*</span>
          </label>

          <AnimatePresence mode="wait">
            {photoPreview ? (
              /* ✅ PHOTO PREVIEW - FIXED: No squash, normal size */
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-[#353F54] shadow-lg bg-slate-50 dark:bg-[#222834]"
              >
                {/* Preview Image - Fixed aspect ratio, no squash */}
                <div className="w-full aspect-video flex items-center justify-center p-2">
                  <img 
                    src={photoPreview} 
                    alt="Preview kendaraan" 
                    className="w-full h-full object-contain rounded-lg" 
                  />
                </div>
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none rounded-2xl" />
                
                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(photoPreview);
                    }}
                    className="w-9 h-9 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-full flex items-center justify-center text-white transition shadow-lg"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="w-9 h-9 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition shadow-lg"
                    title="Ganti foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Success badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Foto siap
                </div>
              </motion.div>
            ) : (
              /* 📷 UPLOAD OPTIONS */
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {/* Camera & Gallery Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="relative group flex flex-col items-center justify-center gap-3 p-5 border-2 border-dashed border-slate-300 dark:border-[#353F54] rounded-2xl hover:border-[#37B6E9] hover:bg-[#37B6E9]/5 dark:hover:bg-[#37B6E9]/10 transition-all duration-300 cursor-pointer bg-white dark:bg-[#242C3B]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#37B6E9] to-[#4B4CED] flex items-center justify-center shadow-lg shadow-[#37B6E9]/30 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Ambil Foto</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Gunakan kamera</p>
                    </div>
                    <span className="absolute inset-0 rounded-2xl border-2 border-[#37B6E9]/0 group-hover:border-[#37B6E9]/30 transition-all duration-300" />
                  </button>

                  {/* Gallery Button */}
                  <button
                    type="button"
                    onClick={handleGalleryClick}
                    className="relative group flex flex-col items-center justify-center gap-3 p-5 border-2 border-dashed border-slate-300 dark:border-[#353F54] rounded-2xl hover:border-[#4B4CED] hover:bg-[#4B4CED]/5 dark:hover:bg-[#4B4CED]/10 transition-all duration-300 cursor-pointer bg-white dark:bg-[#242C3B]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/30 group-hover:scale-110 transition-transform">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dari Galeri</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Pilih foto</p>
                    </div>
                    <span className="absolute inset-0 rounded-2xl border-2 border-[#4B4CED]/0 group-hover:border-[#4B4CED]/30 transition-all duration-300" />
                  </button>
                </div>

                {/* Hidden file input */}
                <input 
                  ref={fileRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileInput} 
                  className="hidden" 
                />

                {/* Camera Tips Collapsible */}
                <AnimatePresence>
                  {showCameraTips && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">
                              Izin Kamera Diperlukan
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                              Browser membutuhkan izin untuk mengakses kamera. Silakan izinkan di pengaturan browser, atau gunakan tombol "Dari Galeri" untuk memilih foto yang sudah ada.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowCameraTips(false)}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Mengerti
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Photography Tips - Professional Version */}
                <motion.div 
                  className="bg-slate-50 dark:bg-[#222834] rounded-xl p-4 border border-slate-200 dark:border-[#353F54]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#37B6E9] rounded-full" />
                    Panduan Foto
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { icon: Ruler, text: "Jarak 1-2 meter dari kendaraan" },
                      { icon: Eye, text: "Pastikan plat nomor terlihat jelas" },
                      { icon: Sun, text: "Hindari silau atau bayangan di plat" },
                      { icon: AlignLeft, text: "Foto dari sudut lurus, tidak miring" },
                    ].map((tip, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        className="flex items-center gap-2.5"
                      >
                        <tip.icon className="w-4 h-4 text-[#37B6E9] shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">{tip.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 🔍 Detection Progress */}
        <AnimatePresence>
          {detecting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="absolute inset-0 w-5 h-5 border-2 border-blue-300 dark:border-blue-700 rounded-full animate-ping opacity-30" />
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {detectionProgress < 30 ? "Mempersiapkan..." : 
                   detectionProgress < 90 ? "Mendeteksi plat nomor..." : 
                   "Memproses hasil..."}
                </span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${detectionProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Menggunakan AI untuk deteksi otomatis
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ⚠️ Detection Error */}
        <AnimatePresence>
          {detectionError && !detecting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Deteksi Tidak Berhasil</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">{detectionError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📝 Form Fields (show after photo) */}
        <AnimatePresence>
          {!detecting && photo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Plate Number */}
              <div>
                <Input
                  label={
                    <span className="flex items-center gap-2">
                      Nomor Plat
                      {!detectionError && form.plate_number && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Terdeteksi
                        </span>
                      )}
                      {detectionError && (
                        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">(Isi Manual)</span>
                      )}
                    </span>
                  }
                  name="plate_number"
                  value={form.plate_number}
                  onChange={handleChange}
                  placeholder="Contoh: B 1234 ABC"
                  required
                  className={cn(
                    "transition-all",
                    !detectionError && form.plate_number && "ring-2 ring-emerald-500/30 border-emerald-300 dark:border-emerald-700"
                  )}
                />
                {!detectionError && form.plate_number && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Plat terdeteksi — bisa dikoreksi jika kurang tepat
                  </motion.p>
                )}
              </div>

              {/* Zone Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#37B6E9]" />
                  Zona Parkir <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="zone_id"
                    value={form.zone_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-300 dark:border-[#353F54] bg-white dark:bg-[#1e2532] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#37B6E9] focus:border-transparent transition appearance-none text-sm"
                    required
                  >
                    <option value="">Pilih zona parkir...</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {zones.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Belum ada zona — hubungi admin
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#37B6E9]" />
                  Keterangan Tambahan
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Contoh: Motor parkir di depan pintu darurat sejak tadi pagi..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#353F54] bg-white dark:bg-[#1e2532] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#37B6E9] focus:border-transparent transition resize-none text-sm"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-right">
                  {form.description?.length || 0}/200 karakter
                </p>
              </div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  type="submit" 
                  fullWidth 
                  disabled={loading} 
                  className={cn(
                    "mt-2 py-3.5 text-sm font-bold shadow-lg shadow-[#37B6E9]/25",
                    loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:shadow-[#37B6E9]/40"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim Laporan...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Kirim Laporan
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </UserLayout>
  );
}