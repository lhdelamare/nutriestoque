import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Camera, X, Check, Barcode, Zap, ZapOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

// Audio feedback helper for successful scan
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch A6 note
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio context autoplay restrictions or missing API
  }
};

export const BarcodeScannerModal: React.FC<Props> = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-reader-viewport';

  // Discover available cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((deviceList) => {
        if (deviceList && deviceList.length > 0) {
          setCameras(deviceList);
          // Prefer environment (back) camera if found in device label or default to back camera index
          const backCam = deviceList.find((cam) =>
            /back|rear|traseira|ambiente|environment/i.test(cam.label)
          );
          setSelectedCameraId(backCam ? backCam.id : deviceList[deviceList.length - 1].id);
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate camera devices:', err);
      });
  }, []);

  // Initialize and start scanner when selected camera or modal mounts
  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      setIsInitializing(true);
      setErrorMsg('');

      // Clean up previous instance if running
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop().catch(() => {});
        }
        html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
      }

      try {
        const instance = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });

        html5QrcodeRef.current = instance;

        // Configuration optimized for 1D barcodes and crisp resolution
        const scanConfig = {
          fps: 20, // Higher frame rate for rapid barcode detection
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Wide rectangle optimized for 1D barcode scanning
            const width = Math.floor(viewfinderWidth * 0.85);
            const height = Math.floor(Math.min(viewfinderHeight * 0.45, 180));
            return {
              width: Math.max(width, 220),
              height: Math.max(height, 100),
            };
          },
          aspectRatio: 1.5,
          videoConstraints: selectedCameraId
            ? { deviceId: { exact: selectedCameraId } }
            : {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        };

        const cameraMode = selectedCameraId ? selectedCameraId : { facingMode: 'environment' };

        await instance.start(
          cameraMode,
          scanConfig,
          (decodedText) => {
            // Success handler
            playBeep();
            if (navigator.vibrate) {
              try {
                navigator.vibrate(100);
              } catch {}
            }

            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
              html5QrcodeRef.current.stop().then(() => {
                onScan(decodedText);
              }).catch(() => {
                onScan(decodedText);
              });
            } else {
              onScan(decodedText);
            }
          },
          () => {
            // Continuous scanning frame errors - ignored intentionally
          }
        );

        if (!isMounted) return;

        setIsInitializing(false);

        // Check if torch/flashlight is supported on current active camera track
        try {
          const caps = instance.getRunningTrackCameraCapabilities();
          if (caps && caps.torchFeature && caps.torchFeature().isSupported()) {
            setHasTorch(true);
          } else {
            setHasTorch(false);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to start Html5Qrcode scanner:', err);
        setIsInitializing(false);
        setErrorMsg('Não foi possível acessar a câmera. Verifique as permissões do seu navegador.');
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(() => {});
        }
        html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
      }
    };
  }, [selectedCameraId, onScan]);

  // Handle Torch (Flashlight) Toggle
  const toggleTorch = async () => {
    if (!html5QrcodeRef.current || !hasTorch) return;
    try {
      const caps = html5QrcodeRef.current.getRunningTrackCameraCapabilities();
      if (caps && caps.torchFeature()) {
        const nextState = !isTorchOn;
        await caps.torchFeature().apply(nextState);
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.warn('Could not toggle torch:', err);
    }
  };

  // Switch to next available camera
  const handleNextCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-brand-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Leitor de Código de Barras</h3>
              <p className="text-[11px] text-brand-100">Aponte o código para o retângulo de captura</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                title={isTorchOn ? 'Desligar Lanterna' : 'Ligar Lanterna'}
                className={`p-2 rounded-xl transition ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleNextCamera}
                title="Trocar Câmera"
                className="p-2 bg-white/15 text-white hover:bg-white/25 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 space-y-3">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800 min-h-[260px] flex items-center justify-center">
            {/* HTML5 Qrcode Container */}
            <div id={containerId} className="w-full h-full text-white text-xs overflow-hidden"></div>

            {/* Scanning Laser Overlay effect */}
            {!isInitializing && !errorMsg && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[85%] h-24 border-2 border-brand-400/80 rounded-xl relative shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                </div>
              </div>
            )}

            {/* Initializing Spinner */}
            {isInitializing && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-2 p-4 text-center">
                <RefreshCw className="w-7 h-7 animate-spin text-brand-400" />
                <p className="text-xs font-semibold text-slate-300">Iniciando câmera de alta velocidade...</p>
              </div>
            )}

            {/* Camera Error Message */}
            {errorMsg && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-rose-300 space-y-2 p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
                <p className="text-xs font-bold">{errorMsg}</p>
                <p className="text-[11px] text-slate-400">Você também pode digitar o código manualmente abaixo.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>💡 Suporta EAN-13, EAN-8, Code-128, QR Code</span>
            {cameras.length > 1 && (
              <span className="font-semibold text-brand-600">
                Câmera {cameras.findIndex((c) => c.id === selectedCameraId) + 1} de {cameras.length}
              </span>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="pt-2 border-t border-slate-100">
            <form onSubmit={handleManualSubmit} className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Barcode className="w-4 h-4 text-brand-600" /> Digite o código de barras se preferir:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: 7891000100100"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1 hover:bg-brand-700 active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Usar</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Fechar Leitor
          </button>
        </div>
      </div>
    </div>
  );
};

