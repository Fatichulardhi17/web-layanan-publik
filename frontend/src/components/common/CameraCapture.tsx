import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  ImagePlus,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface CameraCaptureProps {
  // Hasil foto dikirim sebagai data URL (base64), bukan URL foto
  onCapture: (dataUrl: string) => void;
  // Foto yang sudah terpasang pada form (untuk tombol hapus & preview)
  currentPhoto: string;
  error?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  currentPhoto,
  error,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return stopStream;
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsLoading(true);
    stopStream();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('not-supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Tunggu modal video terpasang sebelum mengalirkan kamera
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError(
        'Kamera pada browser tidak dapat dibuka. Coba izinkan akses kamera, atau gunakan tombol kamera perangkat di bawah.'
      );
      // Fallback: gunakan penyaring file kamera bawaan perangkat
      fileInputRef.current?.click();
    } finally {
      setIsLoading(false);
    }
  };

  const closeCamera = () => {
    stopStream();
    setIsCameraOpen(false);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    // Skala foto agar tetap ringan disimpan & dikirim (sisi panjang maksimum 800px)
    const MAX_DIM = 800;
    const scale = Math.min(1, MAX_DIM / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    onCapture(dataUrl);
    closeCamera();
  };

  const handleFileCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCapture(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="hidden"
      />

      {/* Fallback kamera bawaan perangkat (mis. aplikasi kamera HP) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCaptured}
        className="hidden"
      />

      <label className="block text-xs font-semibold text-[#1F2232] mb-1">
        Foto Bukti Kendala (Ambil Langsung dari Kamera)
      </label>

      {currentPhoto ? (
        <div className="flex items-start space-x-3">
          <div className="w-28 h-20 rounded-[12px] overflow-hidden bg-[#E8E8E2] border border-[#D5D5CE] shrink-0">
            <img
              src={currentPhoto}
              alt="Foto bukti kendala"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={startCamera}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] bg-[#F2F2ED] hover:bg-[#E8E8E2] text-[11px] font-semibold text-[#464B71] transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Ambil Ulang</span>
            </button>
            <button
              type="button"
              onClick={() => onCapture('')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] bg-red-50 hover:bg-red-100 text-[11px] font-semibold text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Foto</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-[12px] border border-dashed border-[#8B8FA3] bg-[#F2F2ED] hover:bg-[#E8E8E2] text-xs font-semibold text-[#464B71] transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Membuka kamera...</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-[#118AB2]" />
              <span>Ambil Foto dengan Kamera</span>
              <ImagePlus className="w-3.5 h-3.5 text-[#8B8FA3]" />
            </>
          )}
        </button>
      )}

      {cameraError && (
        <div className="mt-2 flex items-start space-x-2 text-[10px] text-[#585C74]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span>{cameraError}</span>
        </div>
      )}

      {error && (
        <p className="mt-1 text-[10px] text-red-600 font-semibold">{error}</p>
      )}

      <p className="text-[10px] text-[#8B8FA3] mt-1">
        Foto diambil langsung melalui kamera perangkat dan dilampirkan ke laporan (tanpa tautan URL).
      </p>

      {/* Modal Kamera Live Preview */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E2]">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-[#118AB2]" />
                <span className="text-sm font-bold text-[#1F2232]">
                  Kamera Foto Kendala
                </span>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="p-1.5 rounded-full bg-[#F2F2ED] hover:bg-[#E8E8E2] text-[#464B71] transition-colors"
                aria-label="Tutup kamera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black aspect-[4/3] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-center space-x-3 px-4 py-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-[10px] bg-[#F2F2ED] hover:bg-[#E8E8E2] text-[11px] font-semibold text-[#464B71] transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Album</span>
              </button>
              <button
                type="button"
                onClick={handleCapture}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-[#464B71] hover:bg-[#373B5A] text-white shadow-tactile transition-colors focus-visible:ring-4 focus-visible:ring-[#7CD5C7]"
                aria-label="Ambil foto"
              >
                <Camera className="w-6 h-6 text-[#7CD5C7]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
