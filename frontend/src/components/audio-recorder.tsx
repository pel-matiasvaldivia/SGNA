"use client";

/*
 * Grabador de notas de voz para el Auditor en Campo.
 *
 * Permite dictar la observación de un punto de control en vez de escribirla:
 * graba con el micrófono del teléfono (MediaRecorder) o, si el navegador no lo
 * soporta, deja subir un archivo de audio existente. El audio queda en memoria
 * como Blob; el checklist lo encola en el outbox offline y lo sube al
 * sincronizar. La conversión a texto la hace el backend al finalizar la
 * auditoría (ver services/transcription.py).
 */

import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload, Play, Pause } from "lucide-react";

interface Props {
  value?: Blob | null;
  onChange: (blob: Blob | null, ext: string | null) => void;
  disabled?: boolean;
}

// Elige el mejor contenedor soportado por el navegador y su extensión.
function pickMimeType(): { mime: string; ext: string } {
  const candidatos: { mime: string; ext: string }[] = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" }, // Safari / iOS
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
    for (const c of candidatos) {
      if (MediaRecorder.isTypeSupported(c.mime)) return c;
    }
  }
  return { mime: "", ext: "webm" };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function AudioRecorder({ value, onChange, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // URL de reproducción local del audio adjunto.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Podés subir un archivo.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mime, ext } = pickMimeType();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size > 0) onChange(blob, ext);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("No se pudo acceder al micrófono. Revisá los permisos del navegador.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => setError("No se pudo reproducir el audio."));
    }
  };

  const pickFile = (file: File | null) => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "m4a").toLowerCase();
    onChange(file, ext);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {!value && !recording && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <Mic className="w-4 h-4" /> Grabar nota de voz
            </button>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Subir audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
            </label>
          </>
        )}

        {recording && (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <Square className="w-3.5 h-3.5" /> Detener · {fmt(seconds)}
          </button>
        )}

        {value && !recording && (
          <>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {playing ? "Pausar" : "Escuchar"} nota de voz
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null, null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Quitar
            </button>
            {previewUrl && (
              <audio
                ref={audioRef}
                src={previewUrl}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                className="hidden"
              />
            )}
          </>
        )}
      </div>

      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
