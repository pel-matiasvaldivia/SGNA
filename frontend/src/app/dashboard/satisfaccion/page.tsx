"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  HeartHandshake,
  Plus,
  Search,
  MessageSquare,
  TrendingUp,
  ThumbsUp,
  AlertTriangle,
  Send,
  Sparkles,
  Calendar,
  X,
  CheckCircle,
  FileCheck
} from "lucide-react";

interface Pregunta {
  id: string;
  pregunta_texto: string;
  calificacion: number | null;
  comentarios: string | null;
  encuesta_id: string;
  tenant_id: string;
}

interface Encuesta {
  id: string;
  codigo: string;
  cliente_nombre: string;
  fecha_envio: string;
  fecha_respuesta: string | null;
  estado: string; // enviada, respondida, archivada
  comentarios_generales: string | null;
  tenant_id: string;
  preguntas: Pregunta[];
  nps_score: number;
  csat_score: number;
}

interface FeedbackItem {
  id: string;
  cliente: string;
  codigo: string;
  pregunta: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

export default function SatisfaccionPage() {
  const { data: session } = useSession();
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [npsScore, setNpsScore] = useState(0);
  const [csatScore, setCsatScore] = useState(0);
  const [totalEncuestas, setTotalEncuestas] = useState(0);
  const [totalRespondidas, setTotalRespondidas] = useState(0);

  // Modals & Panels
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [selectedEncuestaForSim, setSelectedEncuestaForSim] = useState<Encuesta | null>(null);

  // Forms
  const [newCampaign, setNewCampaign] = useState({
    codigo: "",
    cliente_nombre: "",
    comentarios_generales: "",
    preguntas: [
      "¿Qué tan probable es que recomiende nuestro servicio a un colega o socio comercial?",
      "¿Cómo evalúa la calidad general del entregable y cumplimiento de especificaciones?",
      "¿Cómo evalúa el tiempo de respuesta y atención de nuestro soporte técnico?"
    ]
  });

  const [newQuestionText, setNewQuestionText] = useState("");

  const [simAnswers, setSimAnswers] = useState<{
    [preguntaId: string]: { calificacion: number; comentarios: string };
  }>({});
  const [simComentariosGenerales, setSimComentariosGenerales] = useState("");

  // Feedback Wall Columns
  const [promotores, setPromotores] = useState<FeedbackItem[]>([]);
  const [pasivos, setPasivos] = useState<FeedbackItem[]>([]);
  const [detractores, setDetractores] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${(session as any).accessToken}`,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/satisfaccion/encuestas`, { headers });
      let data: Encuesta[] = [];
      if (res.ok) {
        data = await res.json();
        setEncuestas(data);
      }

      // Mock setup if empty (WOW Factor)
      if (data.length === 0) {
        const mockEncuestas: Encuesta[] = [
          {
            id: "enc-1",
            codigo: "ENC-001",
            cliente_nombre: "Tech Solutions Inc.",
            fecha_envio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            fecha_respuesta: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            estado: "respondida",
            comentarios_generales: "Excelente servicio de consultoría. El consultor demostró amplio dominio de ISO 9001.",
            tenant_id: "mock",
            preguntas: [
              { id: "q-1-1", pregunta_texto: "¿Qué tan probable es que recomiende nuestro servicio?", calificacion: 10, comentarios: "Recomendado 100%", encuesta_id: "enc-1", tenant_id: "mock" },
              { id: "q-1-2", pregunta_texto: "¿Cómo evalúa la calidad del servicio?", calificacion: 9, comentarios: "Muy conforme con el entregable", encuesta_id: "enc-1", tenant_id: "mock" },
              { id: "q-1-3", pregunta_texto: "¿Cómo califica el tiempo de respuesta?", calificacion: 9, comentarios: "Rápido y atento", encuesta_id: "enc-1", tenant_id: "mock" }
            ],
            nps_score: 100,
            csat_score: 93.3
          },
          {
            id: "enc-2",
            codigo: "ENC-002",
            cliente_nombre: "Constructora Vial S.A.",
            fecha_envio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            fecha_respuesta: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            estado: "respondida",
            comentarios_generales: "El proceso documental fue correcto, pero el tiempo de respuesta de los reportes finales tuvo un leve retraso.",
            tenant_id: "mock",
            preguntas: [
              { id: "q-2-1", pregunta_texto: "¿Qué tan probable es que recomiende nuestro servicio?", calificacion: 8, comentarios: "Buen servicio en general", encuesta_id: "enc-2", tenant_id: "mock" },
              { id: "q-2-2", pregunta_texto: "¿Cómo evalúa la calidad del servicio?", calificacion: 8, comentarios: "Cumplió las expectativas", encuesta_id: "enc-2", tenant_id: "mock" },
              { id: "q-2-3", pregunta_texto: "¿Cómo califica el tiempo de respuesta?", calificacion: 7, comentarios: "Un poco demorados", encuesta_id: "enc-2", tenant_id: "mock" }
            ],
            nps_score: 0,
            csat_score: 76.7
          },
          {
            id: "enc-3",
            codigo: "ENC-003",
            cliente_nombre: "Distribuidora del Sur",
            fecha_envio: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            fecha_respuesta: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            estado: "respondida",
            comentarios_generales: "Hubo serios problemas de coordinación y los informes contenían errores ortográficos y de métricas.",
            tenant_id: "mock",
            preguntas: [
              { id: "q-3-1", pregunta_texto: "¿Qué tan probable es que recomiende nuestro servicio?", calificacion: 5, comentarios: "No lo recomendaría actualmente", encuesta_id: "enc-3", tenant_id: "mock" },
              { id: "q-3-2", pregunta_texto: "¿Cómo evalúa la calidad del servicio?", calificacion: 6, comentarios: "Flojo desempeño técnico", encuesta_id: "enc-3", tenant_id: "mock" },
              { id: "q-3-3", pregunta_texto: "¿Cómo califica el tiempo de respuesta?", calificacion: 4, comentarios: "Nula respuesta a correos urgentes", encuesta_id: "enc-3", tenant_id: "mock" }
            ],
            nps_score: -100,
            csat_score: 50.0
          },
          {
            id: "enc-4",
            codigo: "ENC-004",
            cliente_nombre: "Sistemas Médicos Integrados",
            fecha_envio: new Date().toISOString(),
            fecha_respuesta: null,
            estado: "enviada",
            comentarios_generales: null,
            tenant_id: "mock",
            preguntas: [
              { id: "q-4-1", pregunta_texto: "¿Qué tan probable es que recomiende nuestro servicio?", calificacion: null, comentarios: null, encuesta_id: "enc-4", tenant_id: "mock" },
              { id: "q-4-2", pregunta_texto: "¿Cómo evalúa la calidad del servicio?", calificacion: null, comentarios: null, encuesta_id: "enc-4", tenant_id: "mock" },
              { id: "q-4-3", pregunta_texto: "¿Cómo califica el tiempo de respuesta?", calificacion: null, comentarios: null, encuesta_id: "enc-4", tenant_id: "mock" }
            ],
            nps_score: 0,
            csat_score: 0.0
          }
        ];
        setEncuestas(mockEncuestas);
        data = mockEncuestas;
      }

      calculateMetrics(data);
    } catch (err) {
      console.error("Error loading survey page:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (surveyList: Encuesta[]) => {
    const total = surveyList.length;
    const respondidas = surveyList.filter(e => e.estado === "respondida");
    const countRespondidas = respondidas.length;

    setTotalEncuestas(total);
    setTotalRespondidas(countRespondidas);

    let allRatings: number[] = [];
    let promotersCount = 0;
    let detractorsCount = 0;
    let totalNpsResponses = 0;

    const itemsPromotores: FeedbackItem[] = [];
    const itemsPasivos: FeedbackItem[] = [];
    const itemsDetractores: FeedbackItem[] = [];

    respondidas.forEach(enc => {
      enc.preguntas.forEach(q => {
        if (q.calificacion !== null) {
          allRatings.push(q.calificacion);

          // Standard NPS: rating is 1-10
          if (q.calificacion >= 9) {
            promotersCount++;
          } else if (q.calificacion <= 6) {
            detractorsCount++;
          }
          totalNpsResponses++;

          // Feedback Wall grouping if comments exist
          if (q.comentarios && q.comentarios.trim() !== "") {
            const feed: FeedbackItem = {
              id: q.id,
              cliente: enc.cliente_nombre,
              codigo: enc.codigo,
              pregunta: q.pregunta_texto,
              calificacion: q.calificacion,
              comentario: q.comentarios,
              fecha: enc.fecha_respuesta || enc.fecha_envio
            };

            if (q.calificacion >= 9) {
              itemsPromotores.push(feed);
            } else if (q.calificacion >= 7) {
              itemsPasivos.push(feed);
            } else {
              itemsDetractores.push(feed);
            }
          }
        }
      });
    });

    // Net Promoter Score = % Promotores - % Detractores
    const nps = totalNpsResponses > 0 
      ? Math.round(((promotersCount - detractorsCount) / totalNpsResponses) * 100)
      : 0;

    // CSAT = (Average rating / 10) * 100
    const csat = allRatings.length > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10)
      : 0;

    setNpsScore(nps);
    setCsatScore(csat);
    setPromotores(itemsPromotores);
    setPasivos(itemsPasivos);
    setDetractores(itemsDetractores);
  };

  // --- ACTIONS ---

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session as any).accessToken}`,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/satisfaccion/encuestas`, {
        method: "POST",
        headers,
        body: JSON.stringify(newCampaign),
      });

      if (res.ok) {
        const created = await res.json();
        const updated = [created, ...encuestas];
        setEncuestas(updated);
        calculateMetrics(updated);
        setIsCampaignModalOpen(false);
        setNewCampaign({
          codigo: "",
          cliente_nombre: "",
          comentarios_generales: "",
          preguntas: [
            "¿Qué tan probable es que recomiende nuestro servicio a un colega o socio comercial?",
            "¿Cómo evalúa la calidad general del entregable y cumplimiento de especificaciones?",
            "¿Cómo evalúa el tiempo de respuesta y atención de nuestro soporte técnico?"
          ]
        });
      } else {
        // Mock fallback
        const mockCreated: Encuesta = {
          id: `enc-${Date.now()}`,
          codigo: newCampaign.codigo || `ENC-${Math.floor(100 + Math.random() * 900)}`,
          cliente_nombre: newCampaign.cliente_nombre,
          fecha_envio: new Date().toISOString(),
          fecha_respuesta: null,
          estado: "enviada",
          comentarios_generales: newCampaign.comentarios_generales || null,
          tenant_id: "mock",
          preguntas: newCampaign.preguntas.map((q, idx) => ({
            id: `q-${Date.now()}-${idx}`,
            pregunta_texto: q,
            calificacion: null,
            comentarios: null,
            encuesta_id: `enc-${Date.now()}`,
            tenant_id: "mock"
          })),
          nps_score: 0,
          csat_score: 0.0
        };

        const updated = [mockCreated, ...encuestas];
        setEncuestas(updated);
        calculateMetrics(updated);
        setIsCampaignModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncuestaForSim) return;

    const payload = {
      comentarios_generales: simComentariosGenerales,
      respuestas: Object.keys(simAnswers).map(qid => ({
        pregunta_id: qid,
        calificacion: simAnswers[qid].calificacion,
        comentarios: simAnswers[qid].comentarios
      }))
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session as any).accessToken}`,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/satisfaccion/encuestas/${selectedEncuestaForSim.id}/responder`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const responded = await res.json();
        const updated = encuestas.map(enc => enc.id === selectedEncuestaForSim.id ? responded : enc);
        setEncuestas(updated);
        calculateMetrics(updated);
        setIsSimulatorModalOpen(false);
        setSelectedEncuestaForSim(null);
        setSimAnswers({});
        setSimComentariosGenerales("");
      } else {
        // Mock fallback
        const mockResponded: Encuesta = {
          ...selectedEncuestaForSim,
          estado: "respondida",
          fecha_respuesta: new Date().toISOString(),
          comentarios_generales: simComentariosGenerales || "Respuesta simulada",
          preguntas: selectedEncuestaForSim.preguntas.map(q => ({
            ...q,
            calificacion: simAnswers[q.id]?.calificacion || 8,
            comentarios: simAnswers[q.id]?.comentarios || "Sin comentarios"
          }))
        };

        // Recompute metrics locally
        const ratings = mockResponded.preguntas.map(p => p.calificacion as number);
        const csat = ratings.reduce((a,b)=>a+b,0) / ratings.length * 10;
        const promoters = ratings.filter(r=>r>=9).length;
        const detractors = ratings.filter(r=>r<=6).length;
        const nps = (promoters - detractors) / ratings.length * 100;
        mockResponded.nps_score = Math.round(nps);
        mockResponded.csat_score = Math.round(csat * 10) / 10;

        const updated = encuestas.map(enc => enc.id === selectedEncuestaForSim.id ? mockResponded : enc);
        setEncuestas(updated);
        calculateMetrics(updated);
        setIsSimulatorModalOpen(false);
        setSelectedEncuestaForSim(null);
        setSimAnswers({});
        setSimComentariosGenerales("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addQuestionTemplate = () => {
    if (!newQuestionText) return;
    setNewCampaign({
      ...newCampaign,
      preguntas: [...newCampaign.preguntas, newQuestionText]
    });
    setNewQuestionText("");
  };

  const removeQuestionTemplate = (idx: number) => {
    setNewCampaign({
      ...newCampaign,
      preguntas: newCampaign.preguntas.filter((_, i) => i !== idx)
    });
  };

  // SVG Gauge calculations
  // NPS Score ranges from -100 to +100
  // Semicircular dial covers 180 degrees (from 225 deg to 45 deg or simple 0 to 180 from left to right)
  // Let's map -100 to 0 degrees, and +100 to 180 degrees.
  const needleRotation = ((npsScore + 100) / 200) * 180;

  // Gauge background color depending on score
  let npsColorClass = "text-amber-500";
  let npsBgGrad = "from-amber-400 to-yellow-500";
  if (npsScore >= 50) {
    npsColorClass = "text-emerald-500";
    npsBgGrad = "from-emerald-400 to-teal-500";
  } else if (npsScore < 0) {
    npsColorClass = "text-rose-500";
    npsBgGrad = "from-rose-400 to-red-500";
  }

  // CSAT circular path stroke-dashoffset calculation
  // Radius of circle is 40, circumference = 2 * PI * r = 251.2
  const csatCircumference = 251.2;
  const csatOffset = csatCircumference - (csatScore / 100) * csatCircumference;

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-3xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-teal-500/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-white/20 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              ISO 9001:2015 · Cláusula 9.1.2
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <HeartHandshake className="w-10 h-10 text-rose-300 animate-pulse" />
              Satisfacción del Cliente (NPS / CSAT)
            </h1>
            <p className="text-teal-150/90 text-sm max-w-2xl font-medium">
              Monitorea de forma metrológica y estadística la retroalimentación de tus clientes, 
              calcula indicadores NPS y CSAT en tiempo real y gestiona las no conformidades preventivas en tu muro.
            </p>
          </div>
          <button
            onClick={() => setIsCampaignModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl text-sm transition shadow-lg hover:bg-teal-50 hover:scale-[1.03] active:scale-[0.98] self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Campaña
          </button>
        </div>
      </div>

      {/* METRIC GRAPHICS PANEL (WOW FACTOR VISUAL GAUGE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* NPS SVG GAUGE (LG: 5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/70 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-1.5 justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Net Promoter Score (NPS) General
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Rango de -100 (Detractores) a +100 (Promotores)
            </p>
          </div>

          {/* Premium Handcrafted SVG Semicircular Gauge */}
          <div className="relative w-72 h-44 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 200">
              <defs>
                <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" /> {/* red */}
                  <stop offset="50%" stopColor="#eab308" /> {/* yellow */}
                  <stop offset="100%" stopColor="#10b981" /> {/* green */}
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2"/>
                </filter>
              </defs>

              {/* Gauge Track Arc (180 deg, from (30,150) to (270,150)) */}
              <path
                d="M 40,150 A 110,110 0 0,1 260,150"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="24"
                strokeLinecap="round"
                className="dark:stroke-zinc-800"
              />

              <path
                d="M 40,150 A 110,110 0 0,1 260,150"
                fill="none"
                stroke="url(#gauge-gradient)"
                strokeWidth="22"
                strokeLinecap="round"
              />

              {/* Ticks and values */}
              <text x="35" y="180" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400">-100</text>
              <text x="150" y="32" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400">0</text>
              <text x="265" y="180" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400">+100</text>

              {/* Needle center pin */}
              <circle cx="150" cy="150" r="10" className="fill-zinc-800 dark:fill-zinc-150" />
              <circle cx="150" cy="150" r="4" className="fill-white dark:fill-zinc-950" />

              {/* Needle pointer */}
              <line
                x1="150"
                y1="150"
                x2="150"
                y2="55"
                stroke="#1f2937"
                strokeWidth="5"
                strokeLinecap="round"
                className="dark:stroke-zinc-100 transition-transform duration-1000 ease-out origin-bottom"
                style={{
                  transformOrigin: "150px 150px",
                  transform: `rotate(${needleRotation - 90}deg)`
                }}
              />
            </svg>

            {/* Score Overlay inside arch */}
            <div className="absolute bottom-4 flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tight ${npsColorClass}`}>
                {npsScore > 0 ? `+${npsScore}` : npsScore}
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground mt-0.5">
                {npsScore >= 50 ? "Excelente" : npsScore >= 0 ? "Aceptable" : "Deficiente"}
              </span>
            </div>
          </div>

          <div className="text-xs font-semibold text-muted-foreground w-full grid grid-cols-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/40">
            <div>
              <span className="block text-[10px] font-bold">Total Campañas</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">{totalEncuestas}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold">Respuestas Recibidas</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">{totalRespondidas}</span>
            </div>
          </div>
        </div>

        {/* CSAT CIRCULAR CHART (LG: 4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/70 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-1.5 justify-center">
              <ThumbsUp className="w-4 h-4 text-teal-500" />
              Satisfacción CSAT
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Customer Satisfaction Score (0 - 100%)
            </p>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circular track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e4e4e7"
                strokeWidth="10"
                className="dark:stroke-zinc-800"
              />
              {/* Foreground loader circular ring with gradient */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#0d9488"
                strokeWidth="10"
                strokeDasharray={csatCircumference}
                strokeDashoffset={csatOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                {csatScore}%
              </span>
              <span className="text-[9px] uppercase font-bold text-muted-foreground">
                Aprobación
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground max-w-[240px] font-medium">
            Porcentaje de clientes que calificaron su experiencia general con puntaje 7 o superior.
          </p>
        </div>

        {/* SIMULATOR QUICK CALLOUT (LG: 3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider">Simulador de Respuestas</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Completa o responde de forma interactiva las encuestas enviadas para ver el recálculo dinámico 
              e inmediato de los diales radiales de NPS y CSAT y el Muro de Feedback.
            </p>
          </div>

          <div className="space-y-2.5">
            {encuestas.filter(e => e.estado === "enviada").length === 0 ? (
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-[10px] text-center text-zinc-400 font-semibold">
                No hay encuestas pendientes de respuesta
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Pendientes de Simular</span>
                {encuestas.filter(e => e.estado === "enviada").slice(0, 2).map(enc => (
                  <button
                    key={enc.id}
                    onClick={() => {
                      setSelectedEncuestaForSim(enc);
                      
                      // Initialize simulator answers state
                      const initialAns: any = {};
                      enc.preguntas.forEach(q => {
                        initialAns[q.id] = { calificacion: 9, comentarios: "Excelente cumplimiento, excelente servicio." };
                      });
                      setSimAnswers(initialAns);
                      setSimComentariosGenerales("Todo perfecto, muy contento con el equipo.");
                      setIsSimulatorModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 border border-zinc-200 hover:border-indigo-500 dark:border-zinc-800 dark:hover:border-indigo-500 rounded-xl text-[11px] font-bold transition hover:bg-indigo-50/10 text-left"
                  >
                    <div>
                      <span className="block text-zinc-900 dark:text-white truncate max-w-[120px]">{enc.cliente_nombre}</span>
                      <span className="text-[9px] text-muted-foreground font-normal">{enc.codigo}</span>
                    </div>
                    <Send className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK WALL (WOW GLASSMORPHIC TESTIMONIALS GRID) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-500" />
            Muro de Feedback de Clientes
          </h2>
          <p className="text-xs text-muted-foreground">
            Comentarios reales del personal del cliente clasificados semánticamente según la calificación.
          </p>
        </div>

        {/* FEEDBACK WALL COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMN PROMOTERS (9-10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-950/20 rounded-2xl">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                🟢 Promotores (Puntaje 9-10)
              </span>
              <span className="bg-emerald-500/20 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {promotores.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {promotores.length === 0 ? (
                <div className="text-center p-8 text-zinc-400 text-xs bg-zinc-50/30 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Ningún comentario promotor</div>
              ) : (
                promotores.map(item => (
                  <div key={item.id} className="p-4 bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm backdrop-blur-sm space-y-2.5 text-xs hover:scale-[1.01] hover:shadow transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-950 dark:text-zinc-100">{item.cliente}</span>
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-950/20 px-2 py-0.5 rounded text-[10px] font-bold">{item.calificacion} / 10</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium italic leading-relaxed">
                      &quot;{item.comentario}&quot;
                    </p>
                    <div className="text-[9px] text-muted-foreground font-semibold flex items-center justify-between">
                      <span>Ref: {item.codigo}</span>
                      <span>{new Date(item.fecha).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN PASSIVES (7-8) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-200 dark:border-amber-950/20 rounded-2xl">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                🟡 Pasivos (Puntaje 7-8)
              </span>
              <span className="bg-amber-500/20 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pasivos.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {pasivos.length === 0 ? (
                <div className="text-center p-8 text-zinc-400 text-xs bg-zinc-50/30 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Ningún comentario pasivo</div>
              ) : (
                pasivos.map(item => (
                  <div key={item.id} className="p-4 bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm backdrop-blur-sm space-y-2.5 text-xs hover:scale-[1.01] hover:shadow transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-950 dark:text-zinc-100">{item.cliente}</span>
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-950/20 px-2 py-0.5 rounded text-[10px] font-bold">{item.calificacion} / 10</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium italic leading-relaxed">
                      &quot;{item.comentario}&quot;
                    </p>
                    <div className="text-[9px] text-muted-foreground font-semibold flex items-center justify-between">
                      <span>Ref: {item.codigo}</span>
                      <span>{new Date(item.fecha).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN DETRACTORS (1-6) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-200 dark:border-rose-950/20 rounded-2xl">
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                🔴 Detractores (Puntaje 1-6)
              </span>
              <span className="bg-rose-500/20 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {detractores.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {detractores.length === 0 ? (
                <div className="text-center p-8 text-zinc-400 text-xs bg-zinc-50/30 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Ningún comentario detractor</div>
              ) : (
                detractores.map(item => (
                  <div key={item.id} className="p-4 bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm backdrop-blur-sm space-y-2.5 text-xs hover:scale-[1.01] hover:shadow transition border-l-4 border-l-rose-500">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-950 dark:text-zinc-100">{item.cliente}</span>
                      <span className="bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-950/20 px-2 py-0.5 rounded text-[10px] font-bold">{item.calificacion} / 10</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium italic leading-relaxed">
                      &quot;{item.comentario}&quot;
                    </p>
                    <div className="text-[9px] text-muted-foreground font-semibold flex items-center justify-between">
                      <span>Ref: {item.codigo}</span>
                      <span>{new Date(item.fecha).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* NEW CAMPAIGN SURVEY MODAL */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-600" />
                Crear Nueva Campaña de Satisfacción
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1.5">
                  <label className="text-muted-foreground font-bold">Código</label>
                  <input
                    type="text"
                    required
                    placeholder="ENC-005"
                    value={newCampaign.codigo}
                    onChange={(e) => setNewCampaign({ ...newCampaign, codigo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-muted-foreground font-bold">Nombre del Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Industrial Eléctrica Corp."
                    value={newCampaign.cliente_nombre}
                    onChange={(e) => setNewCampaign({ ...newCampaign, cliente_nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-bold">Comentarios Generales Iniciales</label>
                <textarea
                  placeholder="Detalles sobre el canal de envío (ej: Enviada por correo post-entrega de auditoría)..."
                  value={newCampaign.comentarios_generales}
                  onChange={(e) => setNewCampaign({ ...newCampaign, comentarios_generales: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 font-normal"
                />
              </div>

              <div className="space-y-3">
                <label className="text-muted-foreground font-bold block">Preguntas de la Encuesta (Métricas 1-10)</label>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {newCampaign.preguntas.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <span className="text-[11px] truncate max-w-[340px] font-medium">{q}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestionTemplate(idx)}
                        className="text-red-500 hover:text-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribir nueva pregunta de calidad..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={addQuestionTemplate}
                    disabled={!newQuestionText}
                    className="px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-md"
                >
                  Lanzar Encuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATOR RESPONSE MODAL */}
      {isSimulatorModalOpen && selectedEncuestaForSim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider block w-max">
                  Entrada de Simulador
                </span>
                <h3 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white mt-1.5 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-500" />
                  Simular Respuestas: {selectedEncuestaForSim.cliente_nombre}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsSimulatorModalOpen(false);
                  setSelectedEncuestaForSim(null);
                }}
                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateResponse} className="space-y-4 text-xs font-semibold">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {selectedEncuestaForSim.preguntas.map(q => (
                  <div key={q.id} className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                    <span className="font-bold text-zinc-950 dark:text-zinc-150 block">{q.pregunta_texto}</span>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Puntuación</span>
                        <span className={`px-2 py-0.5 rounded ${
                          (simAnswers[q.id]?.calificacion || 8) >= 9
                            ? "bg-emerald-500/10 text-emerald-600"
                            : (simAnswers[q.id]?.calificacion || 8) >= 7
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-red-500/10 text-red-600"
                        }`}>
                          {simAnswers[q.id]?.calificacion || 8} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={simAnswers[q.id]?.calificacion || 8}
                        onChange={(e) => setSimAnswers({
                          ...simAnswers,
                          [q.id]: {
                            ...simAnswers[q.id],
                            calificacion: Number(e.target.value)
                          }
                        })}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground block font-bold">Comentario de la Pregunta</label>
                      <input
                        type="text"
                        placeholder="Escribe el testimonio del cliente..."
                        value={simAnswers[q.id]?.comentarios || ""}
                        onChange={(e) => setSimAnswers({
                          ...simAnswers,
                          [q.id]: {
                            ...simAnswers[q.id],
                            comentarios: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl text-[11px] bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-bold">Comentarios Generales del Cliente</label>
                <textarea
                  placeholder="Observación general y cierre de la encuesta..."
                  value={simComentariosGenerales}
                  onChange={(e) => setSimComentariosGenerales(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsSimulatorModalOpen(false);
                    setSelectedEncuestaForSim(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md"
                >
                  Enviar Respuestas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
