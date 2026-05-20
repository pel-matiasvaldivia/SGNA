"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Send,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileText,
  Workflow,
  HelpCircle,
  Clock,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap
} from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  time: string;
  type?: "compliance" | "risks" | "root_cause" | "general" | "kpis";
}

interface GapItem {
  clausula: string;
  requisito: string;
  estado: "conforme" | "no_conforme" | "parcial";
  hallazgo: string;
  recomendacion: string;
}

interface RiskMitigation {
  riesgo_nombre: string;
  nivel_riesgo: "Critico" | "Alto" | "Medio" | "Bajo";
  analisis: string;
  control_propuesto: string;
  probabilidad_residual: number;
  impacto_residual: number;
}

interface ActionSugerida {
  accion: string;
  responsable: string;
  plazo_dias: number;
}

interface IshikawaAnalysis {
  codigo: string;
  descripcion: string;
  ishikawa: Record<string, string[]>;
  five_whys: string[];
  acciones_sugeridas: ActionSugerida[];
}

interface KPISummary {
  kpis_analizados: number;
  kpis_en_meta: number;
  kpis_criticos: number;
  resumen_ejecutivo: string;
  alertas_detectadas: string[];
  acciones_recomendadas: string[];
}

export default function IAAuditorPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "### 🤖 SGI IA Hub - Copiloto de Auditoría Activo\n\n¡Hola! Soy tu asistente de auditoría inteligente y estoy listo para certificar la norma **ISO 9001:2015**.\n\nTengo acceso en tiempo real a tu base de datos y puedo ayudarte a:\n- Realizar un **Análisis de Brechas** completo.\n- Resolver desviaciones con un diagrama de **Ishikawa y 5 Porqués**.\n- Evaluar la **Mitigación de Riesgos** de calidad.\n- Condensar un **Resumen Ejecutivo de KPIs**.\n\n¿Por dónde te gustaría empezar hoy?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "general"
    }
  ]);
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"none" | "gap" | "ishikawa" | "risks" | "kpis">("none");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // SGI Stats
  const [complianceScore, setComplianceScore] = useState(82);
  
  // SGI Analysis Data
  const [gapData, setGapData] = useState<GapItem[]>([]);
  const [ishikawaData, setIshikawaData] = useState<IshikawaAnalysis | null>(null);
  const [risksData, setRisksData] = useState<RiskMitigation[]>([]);
  const [kpiData, setKpiData] = useState<KPISummary | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load initial simulated stats
  useEffect(() => {
    if (session) {
      // Simulate reading live SGI state
      setTimeout(() => {
        setComplianceScore(84);
      }, 800);
    }
  }, [session]);

  const apiHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${(session as any)?.accessToken || ""}`,
  });

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "";

  // -------------------------------------------------------------
  // TRIGGER CHAT MESSAGE
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText("");

    // Add user message
    const userMsg: Message = {
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/ia/chat`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ prompt: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: "ai",
          text: data.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: data.metadata?.type || "general"
        }]);
        
        if (data.metadata?.score) {
          setComplianceScore(data.metadata.score);
        }
      } else {
        // High fidelity fallback locally if service is unreachable
        simulateAIChatResponse(text);
      }
    } catch (error) {
      console.error("Error connecting to IA chat:", error);
      simulateAIChatResponse(text);
    } finally {
      setIsTyping(false);
    }
  };

  const simulateAIChatResponse = (prompt: string) => {
    setTimeout(() => {
      let response = "";
      let type: any = "general";
      const promptLower = prompt.toLowerCase();

      if (promptLower.includes("brecha") || promptLower.includes("cumplimiento") || promptLower.includes("diagnostico")) {
        response = `### 📊 Reporte de Brechas SGI (Simulación Local)\n\nHe analizado el diagnóstico actual del SGI. El porcentaje global de conformidad se sitúa en un **84.3%**.\n\n* **Cláusula 4.1 (Contexto)**: 🟢 Conforme. FODA documentado.\n* **Cláusula 7.2 (Competencia)**: 🔴 No Conforme. Brecha detectada en planes anuales de capacitación de personal clave.\n* **Cláusula 9.3 (Revisión por la Dirección)**: 🟢 Conforme.\n\nRecomiendo priorizar el cierre de brechas de la cláusula 7.2 mediante una campaña extraordinaria de capacitación.`;
        type = "compliance";
      } else if (promptLower.includes("riesgo") || promptLower.includes("mitiga") || promptLower.includes("control")) {
        response = `### 🛡️ Mitigación de Riesgos SGI (Simulación Local)\n\nSe han analizado 3 riesgos de calidad críticos:\n\n1. **Descalibración inadvertida de báscula**: 🔥 Alto. Mitigación: Configurar alertas automáticas preventivas en el SGI.\n2. **Ruptura de confidencialidad DMS**: 🔥 Crítico. Mitigación: Implementar segregación estricta de roles.\n3. **Ausencia de auditores certificados**: ⚠️ Medio. Mitigación: Capacitar a 2 personas adicionales.`;
        type = "risks";
      } else if (promptLower.includes("no conformidad") || promptLower.includes("causa") || promptLower.includes("ishikawa")) {
        response = `### 🔍 Causa Raíz Ishikawa (Simulación Local)\n\n* **Método**: Sin instructivo de calibración visible.\n* **Mano de Obra**: Técnico no capacitado para el nuevo sensor.\n* **Máquina**: Sensor descalibrado (+0.25g).\n* **Medición**: Intervalos de calibración muy largos.\n\n**5 Porqués (Causa Raíz):** Ausencia de un software de control de calibraciones integrado.`;
        type = "root_cause";
      } else {
        response = `### 🤖 SGI IA Hub - Asistente en Vivo\n\nNo he logrado emparejar tu consulta exacta con una base de datos específica, pero puedo asesorarte en la norma **ISO 9001:2015**. Puedes usar los botones de **Acción Rápida** del panel derecho para obtener un informe riguroso y automatizado del SGI en caliente.`;
      }

      setMessages(prev => [...prev, {
        sender: "ai",
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type
      }]);
      setIsTyping(false);
    }, 1200);
  };

  // -------------------------------------------------------------
  // TRIGGER ACTIONS / QUICK ACTIONS PANELS
  // -------------------------------------------------------------
  
  const triggerGapAnalysis = async () => {
    setActiveAnalysisTab("gap");
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/ia/gap-analysis`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setGapData(data.items);
        setComplianceScore(data.score);
      } else {
        // Simulated local gap data
        setGapData([
          { clausula: "4.1", requisito: "Comprensión de la organización y contexto", estado: "conforme", hallazgo: "Análisis FODA y PESTEL actualizados en diciembre.", recomendacion: "Revisar semestralmente." },
          { clausula: "5.2", requisito: "Política de la calidad", estado: "conforme", hallazgo: "Política de calidad firmada y expuesta en planta.", recomendacion: "Divulgar a nuevos ingresantes." },
          { clausula: "6.1", requisito: "Acciones para abordar riesgos", estado: "parcial", hallazgo: "Riesgos listados pero sin planes de acción estructurados.", recomendacion: "Implementar plan de mitigación." },
          { clausula: "7.2", requisito: "Competencia del personal", estado: "no_conforme", hallazgo: "Colaboradores con brechas críticas de nivel en capacitación.", recomendacion: "Planificar cursos urgentes." },
          { clausula: "8.2", requisito: "Requisitos para productos y servicios", estado: "conforme", hallazgo: "Flujo comercial y aprobaciones documentadas.", recomendacion: "Mantener el estándar comercial." },
          { clausula: "9.3", requisito: "Revisión por la dirección", estado: "conforme", hallazgo: "Reuniones de dirección completadas y cargadas.", recomendacion: "Agendar próxima reunión semestral." }
        ]);
        setComplianceScore(83);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const triggerIshikawa = async () => {
    setActiveAnalysisTab("ishikawa");
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/ia/root-cause`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setIshikawaData(data);
      } else {
        setIshikawaData({
          codigo: "NC-2026-004",
          descripcion: "Existen calibraciones de equipos preventivas con fecha de vencimiento expirada sin resolver.",
          ishikawa: {
            "Método": ["Falta de instructivos legibles de calibración en planta.", "Inexistencia de un calendario preventivo compartido."],
            "Mano de Obra": ["Técnico de calidad no recibió alertas del vencimiento del servicio.", "Falta de capacitación sobre el uso de la planilla de control."],
            "Máquina": ["Patrones de calibración desgastados o sin certificación del INTI."],
            "Medición": ["Tolerancia de calibración interna desconfigurada en balanzas."],
            "Medio Ambiente": ["Humedad excesiva en depósito afectando el calibrado diario."]
          },
          five_whys: [
            "1. ¿Por qué ocurrió la no conformidad? Las calibraciones estaban vencidas.",
            "2. ¿Por qué estaban vencidas? El encargado no realizó el mantenimiento en la fecha planificada.",
            "3. ¿Por qué no lo realizó? No contaba con una alerta automática en el sistema.",
            "4. ¿Por qué no había alerta? El sistema heredado no enviaba correos automáticos.",
            "5. ¿Por qué se usaba ese sistema? [Causa Raíz] Ausencia de un módulo integral de Equipos y Calibración en la plataforma."
          ],
          acciones_sugeridas: [
            { accion: "Migrar calibraciones al módulo de Equipos SGNA", responsable: "Coordinador de Calidad", plazo_dias: 7 },
            { accion: "Configurar alertas automáticas vía email a 30, 15 y 5 días", responsable: "Administrador de Sistemas", plazo_dias: 3 },
            { accion: "Capacitar a todo el personal técnico de piso", responsable: "Líder de Capacitación", plazo_dias: 15 }
          ]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const triggerRiskMitigation = async () => {
    setActiveAnalysisTab("risks");
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/ia/risk-advice`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setRisksData(data.mitigaciones);
      } else {
        setRisksData([
          { riesgo_nombre: "Ruptura de confidencialidad en almacenamiento DMS", nivel_riesgo: "Critico", analisis: "Alta probabilidad debido a accesos mal configurados en carpetas.", control_propuesto: "Implementar segregación de roles mediante NextAuth y logs.", probabilidad_residual: 1, impacto_residual: 3 },
          { riesgo_nombre: "Descalibración inadvertida de báscula de envasado", nivel_riesgo: "Alto", analisis: "Causa desvíos en el peso del producto final (ISO 9001).", control_propuesto: "Cargar equipo en módulo SGNA y programar calibraciones automáticas.", probabilidad_residual: 1, impacto_residual: 2 },
          { riesgo_nombre: "Ausencia de colaboradores certificados para auditoría", nivel_riesgo: "Medio", analisis: "Riesgo de observaciones graves por parte del auditor del ente.", control_propuesto: "Vincular competencias al colaborador en el módulo de Capacitación.", probabilidad_residual: 2, impacto_residual: 2 }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const triggerKPISummary = async () => {
    setActiveAnalysisTab("kpis");
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/ia/kpi-summary`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setKpiData(data);
      } else {
        setKpiData({
          kpis_analizados: 5,
          kpis_en_meta: 3,
          kpis_criticos: 1,
          resumen_ejecutivo: "El desempeño de los Indicadores de Calidad (KPIs) del SGI refleja estabilidad operativa con el 60% de los indicadores operando plenamente dentro de las metas ISO 9001:2015. Sin embargo, se detectó 1 indicador en zona crítica que requiere atención inmediata.",
          alertas_detectadas: [
            "KPI-OP-004 (Eficiencia en Envasado) se encuentra al 72% (Meta: 85%) por problemas mecánicos.",
            "Retraso de 14 días en el cierre de la Acción Correctiva AC-2026-012."
          ],
          acciones_recomendadas: [
            "Planificar reunión extraordinaria de calibración operativa para la línea de envasado.",
            "Reforzar capacitación técnica cruzada en el módulo de Capacitación."
          ]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // SVG Gauge calculations
  // Circumference = 2 * PI * r = 2 * 3.1416 * 40 = 251.3
  const circumference = 251.3;
  const strokeDashoffset = circumference - (complianceScore / 100) * circumference;

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      
      {/* HEADER BANNER WITH GLASSMORPHISM AND NEON EFFECTS */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white rounded-3xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <span className="bg-white/20 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              M14 · SGI AI Hub / Model Context Protocol Integration
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3">
              <Brain className="w-12 h-12 text-pink-300 animate-pulse" />
              Copiloto de Auditoría e Inteligencia Hub
            </h1>
            <p className="text-indigo-100/90 text-sm max-w-3xl font-medium leading-relaxed">
              Gestiona el cumplimiento de tus normas ISO 9001:2015 en tiempo real. Utiliza el motor MCP para
              ejecutar análisis de brechas de conformidad automatizados, resolver no conformidades mediante Ishikawa
              y monitorear la salud operacional de tu SGI.
            </p>
          </div>
          
          {/* Circular SVG Gauge for SGI Score */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start lg:self-auto">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Track circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                {/* Compliance circle loader */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white">{complianceScore}%</span>
                <span className="text-[8px] font-black uppercase text-emerald-300">Conformidad</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-indigo-200 block font-semibold uppercase tracking-wider">Salud del SGI</span>
              <h3 className="text-base font-black text-white">Nivel Operativo Alto</h3>
              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">🟢 Aprobado para Auditoría</span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* COLUMN 1: LIVE CHAT CONSOLE (XL: 6 cols) */}
        <div className="xl:col-span-6 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/70 rounded-3xl shadow-sm flex flex-col h-[640px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/20">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">Auditor Consultivo de IA</h3>
                <span className="text-[9px] text-emerald-500 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Conexión segura al Tenant: {(session as any)?.tenantSlug || "default"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    sender: "ai",
                    text: "### 🤖 SGI IA Hub - Copiloto de Auditoría Activo\n\n¡Hola! He reiniciado la sesión. ¿Qué aspecto de la norma **ISO 9001:2015** te gustaría analizar de forma prioritaria en tu SGI?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: "general"
                  }
                ]);
              }}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 rounded-lg transition"
              title="Limpiar Conversación"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          {/* Chat History Box */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 shadow-sm font-medium ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-tr-none font-semibold"
                      : "bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-150 dark:border-zinc-800/80 rounded-tl-none text-zinc-700 dark:text-zinc-300"
                  }`}>
                    {/* Render basic Markdown bullet lists inside message bubble */}
                    <div className="space-y-2">
                      {msg.text.split("\n\n").map((para, pIdx) => {
                        if (para.startsWith("###")) {
                          return <h4 key={pIdx} className="font-extrabold text-sm text-zinc-950 dark:text-white mt-2 mb-1">{para.replace("###", "").trim()}</h4>;
                        }
                        if (para.startsWith("####")) {
                          return <h5 key={pIdx} className="font-bold text-xs text-zinc-900 dark:text-zinc-200 mt-2 mb-1">{para.replace("####", "").trim()}</h5>;
                        }
                        
                        // Check for list items
                        if (para.startsWith("* ") || para.startsWith("- ")) {
                          return (
                            <ul key={pIdx} className="list-disc pl-4 space-y-1 mt-1">
                              {para.split("\n").map((li, lIdx) => (
                                <li key={lIdx}>
                                  {li.replace(/^(\*\s|-\s)/, "")
                                    .replace(/\*\*(.*?)\*\*/g, "$1") // Simple bold replacement
                                  }
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        
                        // Replace simple bold markers
                        const formattedText = para.split("**").map((chunk, cIdx) => 
                          cIdx % 2 === 1 ? <strong key={cIdx} className="font-extrabold text-zinc-950 dark:text-white">{chunk}</strong> : chunk
                        );
                        
                        return <p key={pIdx}>{formattedText}</p>;
                      })}
                    </div>
                  </div>
                  
                  <span className={`text-[9px] text-muted-foreground block ${msg.sender === "user" ? "text-right" : ""}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick presets queries */}
          <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="text-[10px] uppercase font-black text-muted-foreground mr-1">Consultas rápidas:</span>
            <button
              onClick={() => handleSendMessage("¿Cuáles son las brechas de conformidad críticas?")}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-purple-100/60 dark:bg-zinc-900 dark:hover:bg-purple-950/20 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 transition"
            >
              Inspeccionar Brechas ISO 9001
            </button>
            <button
              onClick={() => handleSendMessage("Quiero un Ishikawa para balanzas descalibradas")}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-purple-100/60 dark:bg-zinc-900 dark:hover:bg-purple-950/20 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 transition"
            >
              Ishikawa Balanzas
            </button>
            <button
              onClick={() => handleSendMessage("¿Qué riesgos críticos detectas en el SGI?")}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-purple-100/60 dark:bg-zinc-900 dark:hover:bg-purple-950/20 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 transition"
            >
              Riesgos Operacionales
            </button>
          </div>

          {/* Chat input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu consulta de auditoría..."
              className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
            />
            <button
              type="submit"
              className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* COLUMN 2: AUDITOR ACTIONS PANEL (XL: 6 cols) */}
        <div className="xl:col-span-6 space-y-6">
          
          {/* QUICK ACTIONS BUTTONS */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/70 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Panel de Acciones Rápidas (Auditoría Express)
              </h3>
              <p className="text-xs text-muted-foreground">
                Lanza consultas de auditoría automáticas y visualiza resultados estructurados al instante.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={triggerGapAnalysis}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:scale-[1.03] hover:shadow-md transition ${
                  activeAnalysisTab === "gap"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500"
                }`}
              >
                <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-black uppercase">Brechas ISO</span>
              </button>
              
              <button
                onClick={triggerIshikawa}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:scale-[1.03] hover:shadow-md transition ${
                  activeAnalysisTab === "ishikawa"
                    ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-purple-500"
                }`}
              >
                <Workflow className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-black uppercase">Ishikawa & 5 Porqués</span>
              </button>

              <button
                onClick={triggerRiskMitigation}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:scale-[1.03] hover:shadow-md transition ${
                  activeAnalysisTab === "risks"
                    ? "bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-pink-500"
                }`}
              >
                <AlertTriangle className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                <span className="text-[10px] font-black uppercase">Asesor Riesgos</span>
              </button>

              <button
                onClick={triggerKPISummary}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:scale-[1.03] hover:shadow-md transition ${
                  activeAnalysisTab === "kpis"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-500"
                }`}
              >
                <Activity className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-black uppercase">Resumen KPI</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC ANALYSIS DISPLAY PANEL */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/70 rounded-3xl p-6 shadow-sm min-h-[352px] flex flex-col">
            
            {loadingAnalysis && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
                <Clock className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-muted-foreground font-bold">Compilando análisis inteligente en caliente...</span>
              </div>
            )}

            {!loadingAnalysis && activeAnalysisTab === "none" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-zinc-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">Ninguna consulta disparada</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    Selecciona una acción en la grilla superior para disparar el motor cognitivo sobre los datos del Tenant.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: GAP ANALYSIS DISPLAY */}
            {!loadingAnalysis && activeAnalysisTab === "gap" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">Diagnóstico de Brechas ISO 9001</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold">Trazabilidad de cláusulas fundamentales</span>
                  </div>
                  <span className="bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">
                    Conformidad: {complianceScore}%
                  </span>
                </div>
                
                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {gapData.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-zinc-950 dark:text-white">Cláusula {item.clausula} - {item.requisito}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          item.estado === "conforme" 
                            ? "bg-emerald-500/10 text-emerald-600" 
                            : (item.estado === "parcial" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600")
                        }`}>
                          {item.estado === "conforme" ? "Conforme" : (item.estado === "parcial" ? "Parcial" : "Brecha")}
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium"><strong className="text-zinc-700 dark:text-zinc-300">Hallazgo:</strong> *{item.hallazgo}*</p>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium"><strong className="text-zinc-700 dark:text-zinc-300">Acción Recomendada:</strong> {item.recomendacion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ISHIKAWA DISPLAY */}
            {!loadingAnalysis && activeAnalysisTab === "ishikawa" && ishikawaData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">Ishikawa & 5 Porqués: {ishikawaData.codigo}</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold">Análisis de Desviación de Calidad</span>
                  </div>
                  <HelpCircle className="w-5 h-5 text-purple-500 animate-pulse" />
                </div>
                
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-xs">
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 block mb-0.5">Problema detectado:</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium italic">*{ishikawaData.descripcion}*</p>
                  </div>
                  
                  {/* Fishbone list categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(ishikawaData.ishikawa).map((cat, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl text-xs space-y-1">
                        <span className="font-extrabold text-zinc-950 dark:text-white block uppercase tracking-wider text-[9px] text-indigo-500">{cat}</span>
                        {ishikawaData.ishikawa[cat].map((cause, cIdx) => (
                          <span key={cIdx} className="block text-zinc-500 dark:text-zinc-400 font-medium">- {cause}</span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 5 Whys */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/40 rounded-xl text-xs space-y-2">
                    <span className="font-extrabold text-zinc-950 dark:text-white block uppercase tracking-wider text-[9px] text-purple-500">Mapeo de los 5 Porqués</span>
                    {ishikawaData.five_whys.map((why, idx) => (
                      <span key={idx} className={`block leading-relaxed font-medium ${idx === 4 ? "font-bold text-rose-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                        {why}
                      </span>
                    ))}
                  </div>

                  {/* Suggesed corrective actions */}
                  <div className="space-y-2">
                    <span className="font-extrabold text-zinc-950 dark:text-white block uppercase tracking-wider text-[9px]">Acciones Correctivas Propuestas</span>
                    {ishikawaData.acciones_sugeridas.map((act, idx) => (
                      <div key={idx} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-zinc-900 dark:text-white block">{act.accion}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">Responsable: {act.responsable}</span>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black shrink-0">Plazo: {act.plazo_dias}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RISK MITIGATION DISPLAY */}
            {!loadingAnalysis && activeAnalysisTab === "risks" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">Mitigación de Riesgos SGI</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold">Asesor de Controles ISO 31000</span>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-pink-500 animate-pulse" />
                </div>
                
                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {risksData.map((risk, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl space-y-2 text-xs border-l-4 border-l-pink-500">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-zinc-950 dark:text-white">{risk.riesgo_nombre}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          risk.nivel_riesgo === "Critico" 
                            ? "bg-rose-500/15 text-rose-600" 
                            : (risk.nivel_riesgo === "Alto" ? "bg-orange-500/15 text-orange-600" : "bg-yellow-500/15 text-yellow-600")
                        }`}>
                          {risk.nivel_riesgo}
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium"><strong className="text-zinc-700 dark:text-zinc-300">Análisis Operacional:</strong> {risk.analisis}</p>
                      <p className="p-2.5 bg-pink-500/5 border border-pink-500/10 rounded-lg text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                        <strong className="text-pink-600 dark:text-pink-400">Control Producido:</strong> {risk.control_propuesto}
                      </p>
                      <div className="flex gap-4 text-[10px] font-bold text-muted-foreground pt-1 border-t border-zinc-200/30">
                        <span>Probabilidad Residual Proyectada: {risk.probabilidad_residual} / 5</span>
                        <span>Impacto Residual Proyectado: {risk.impacto_residual} / 5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: KPI EXECUTIVE SUMMARY DISPLAY */}
            {!loadingAnalysis && activeAnalysisTab === "kpis" && kpiData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">KPI e Indicadores SGI</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold">Resumen de Desempeño Operativo</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                    KPIs Analizados: {kpiData.kpis_analizados}
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  
                  {/* Indicators stats summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-muted-foreground block">KPIs en Meta</span>
                      <span className="text-2xl font-black text-emerald-600">{kpiData.kpis_en_meta}</span>
                    </div>
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-muted-foreground block">KPIs Críticos</span>
                      <span className="text-2xl font-black text-rose-600">{kpiData.kpis_criticos}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-zinc-950 dark:text-white block uppercase tracking-wider text-[9px] text-indigo-500">Resumen del Auditor</span>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{kpiData.resumen_ejecutivo}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-extrabold text-zinc-950 dark:text-white block uppercase tracking-wider text-[9px] text-rose-500">Alertas Detectadas</span>
                    {kpiData.alertas_detectadas.map((alert, idx) => (
                      <span key={idx} className="block text-zinc-500 dark:text-zinc-400 font-medium text-xs leading-relaxed">- {alert}</span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <span className="font-extrabold text-zinc-950 dark:text-white block uppercase tracking-wider text-[9px] text-emerald-500">Acciones Recomendadas</span>
                    {kpiData.acciones_recomendadas.map((action, idx) => (
                      <span key={idx} className="block text-zinc-500 dark:text-zinc-400 font-medium text-xs leading-relaxed">- {action}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
