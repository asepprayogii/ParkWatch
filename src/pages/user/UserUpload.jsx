import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { createReport, uploadPhoto, getZones } from "../../services/reports";
import { detectPlateNumber } from "../../utils/ocr";
import UserLayout from "../../components/layout/UserLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { sendNotificationToSatpam } from "../../services/notifications";

export default function UserUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    plate_number: "",
    zone_id: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getZones().then(setZones).catch(console.error);
  }, []);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setOcrFailed(false);
    setForm((f) => ({ ...f, plate_number: "" }));

    // Langsung jalankan OCR
    setOcrLoading(true);
    setOcrProgress(0);
    const plate = await detectPlateNumber(file, setOcrProgress);
    setOcrLoading(false);

    if (plate) {
      setForm((f) => ({ ...f, plate_number: plate }));
    } else {
      setOcrFailed(true);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setOcrFailed(false);
    setForm((f) => ({ ...f, plate_number: "" }));
    fileRef.current.value = "";
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

    setLoading(true);
    setError("");
    try {
      const photo_url = await uploadPhoto(photo, user.id);
      const report = await createReport({
        user_id: user.id,
        plate_number: form.plate_number.toUpperCase(),
        zone_id: form.zone_id,
        photo_url,
        description: form.description,
      });

      // Kirim notifikasi ke satpam yang bertugas di zona ini
      await sendNotificationToSatpam({
        zoneId: form.zone_id,
        reportId: report.id,
        plateNumber: form.plate_number.toUpperCase(),
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
        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        {/* Upload Foto */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Foto Kendaraan <span className="text-red-400">*</span>
          </label>

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={photoPreview} alt="preview" className="w-full h-56 object-cover" />
              <button type="button" onClick={handleRemovePhoto} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="w-full h-44 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-slate-400 font-medium">Tap untuk foto kendaraan</span>
              <span className="text-xs text-slate-300">Pastikan plat nomor terlihat jelas</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        </div>

        {/* OCR Status */}
        {ocrLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-blue-700">Mendeteksi plat nomor... {ocrProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
            </div>
          </div>
        )}

        {ocrFailed && !ocrLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-700">Plat tidak terdeteksi otomatis. Ketik nomor plat secara manual.</span>
          </div>
        )}

        {!ocrLoading && photo && (
          <>
            {/* Plat Nomor */}
            <div>
              <Input label={`Nomor Plat ${ocrFailed ? "(Isi Manual)" : "(Terdeteksi Otomatis)"}`} name="plate_number" value={form.plate_number} onChange={handleChange} placeholder="contoh: B 1234 ABC" required />
              {!ocrFailed && form.plate_number && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Plat terdeteksi — bisa dikoreksi jika kurang tepat
                </p>
              )}
            </div>

            {/* Zona */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Zona Parkir <span className="text-red-400">*</span>
              </label>
              <select
                name="zone_id"
                value={form.zone_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-sm"
              >
                <option value="">Pilih zona parkir...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              {zones.length === 0 && <p className="text-xs text-slate-400 mt-1">Belum ada zona — hubungi admin</p>}
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Keterangan Tambahan</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="contoh: Motor parkir di depan pintu darurat sejak tadi pagi"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none text-sm"
              />
            </div>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Mengirim Laporan..." : "Kirim Laporan"}
            </Button>
          </>
        )}
      </form>
    </UserLayout>
  );
}
