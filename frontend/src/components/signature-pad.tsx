"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenLine, Eraser, X, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Modal de firma digital. El auditor firma con el dedo/mouse; devuelve la firma
 * como PNG (Blob) para cerrar la auditoría.
 */
export default function SignaturePad({
  onCancel,
  onSign,
  submitting,
  firmante,
}: {
  onCancel: () => void;
  onSign: (blob: Blob) => void;
  submitting?: boolean;
  firmante?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0B1F3A";
    }
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
  };

  const confirm = () => {
    canvasRef.current!.toBlob((blob) => { if (blob) onSign(blob); }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <PenLine className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm text-foreground flex-1">Firmar y cerrar auditoría</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-3">
            Firmá en el recuadro para dejar constancia del cierre de la auditoría.
          </p>
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="w-full h-44 rounded-xl border-2 border-dashed border-border touch-none bg-white cursor-crosshair"
          />
          {firmante && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">Firma de <strong className="text-foreground">{firmante}</strong></p>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-lg border border-border transition"
            >
              <Eraser className="w-4 h-4" /> Limpiar
            </button>
            <button
              onClick={confirm}
              disabled={!hasInk || submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-secondary text-white px-4 py-2.5 rounded-lg hover:bg-secondary/90 transition shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Firmar y finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
