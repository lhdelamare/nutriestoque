import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X, Check, Barcode } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<Props> = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA
        ]
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Scanned successfully!
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignore frame read errors
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

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
              <p className="text-[11px] text-brand-100">Aponte a câmera do celular para a embalagem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
            <div id="reader" className="w-full text-white text-xs"></div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium">
            💡 Funciona com códigos EAN-13, QR Codes e códigos de barras alimentícios
          </div>

          {/* Manual Input Fallback */}
          <div className="pt-3 border-t border-slate-100">
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Barcode className="w-4 h-4 text-brand-600" /> Ou digite o código manualmente:
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
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1 hover:bg-brand-700 active:scale-95"
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
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Fechar Leitor
          </button>
        </div>
      </div>
    </div>
  );
};
