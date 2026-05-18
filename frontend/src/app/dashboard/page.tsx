"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FolderClosed, CheckSquare, AlertOctagon, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";

export default function DashboardIndex() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    documents: 0,
    pendingApprovals: 0,
    nonConformities: 0,
  });

  useEffect(() => {
    // Dynamically retrieve basic statistical summaries
    const fetchStats = async () => {
      try {
        if (!session?.user) return;
        const authHeader = `Bearer ${(session as any).accessToken}`;

        // Fetch documents
        const docRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/list`, {
          headers: { Authorization: authHeader },
        });
        const docs = await docRes.json();

        // Fetch non conformities
        const ncRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/iso9001/non-conformities`, {
          headers: { Authorization: authHeader },
        });
        const ncs = await ncRes.json();

        if (Array.isArray(docs) && Array.isArray(ncs)) {
          setStats({
            documents: docs.length,
            pendingApprovals: docs.filter((d: any) => d.status === "pendiente").length,
            nonConformities: ncs.filter((n: any) => n.estado === "abierta").length,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      }
    };

    fetchStats();
  }, [session]);

  const cards = [
    {
      title: "Documentos de Evidencia",
      value: stats.documents,
      desc: "Manuales, auditorías y huella de carbono",
      color: "border-l-4 border-primary",
      icon: FolderClosed,
      link: "/dashboard/documents"
    },
    {
      title: "Pendientes de Aprobación",
      value: stats.pendingApprovals,
      desc: "Revisiones críticas de aseguramiento",
      color: "border-l-4 border-yellow-500",
      icon: CheckSquare,
      link: "/dashboard/approvals"
    },
    {
      title: "No Conformidades Activas",
      value: stats.nonConformities,
      desc: "Acciones correctivas ISO 9001 abiertas",
      color: "border-l-4 border-secondary",
      icon: AlertOctagon,
      link: "/dashboard/iso9001"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic welcome header banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 select-none pointer-events-none">
          <Activity className="w-96 h-96" />
        </div>
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="bg-secondary text-white text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
            Fase 3 Activa
          </span>
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            ¡Bienvenido de vuelta, {session?.user?.email || "Usuario"}!
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            Consola centralizada para la Gestión Documental DMS e ISO 9001. Administra evidencias de huella de carbono, registra desviaciones y ejecuta planes de acción correctiva integrados bajo aislamiento de base de datos y almacenamiento en la nube de MinIO.
          </p>
        </div>
      </div>

      {/* Statistics Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-white dark:bg-zinc-950 p-6 rounded-xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow group ${card.color}`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {card.title}
                  </span>
                  <span className="text-4xl font-extrabold tracking-tight block">
                    {card.value}
                  </span>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg group-hover:bg-muted/70 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground italic truncate">
                  {card.desc}
                </span>
                <Link
                  href={card.link}
                  className="text-secondary font-bold flex items-center gap-1 hover:underline ml-2 flex-shrink-0"
                >
                  <span>Ingresar</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Notice cards */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border p-6 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-secondary/10 rounded-full text-secondary">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-3xl">
          <h4 className="font-semibold text-sm">Aislamiento Multitenant Certificado</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Todos los documentos, versiones de archivos de evidencia e informes de auditoría almacenados están aislados físicamente a nivel lógico mediante esquemas dedicados en PostgreSQL y a nivel de almacenamiento binario en MinIO con nombres de buckets restringidos al identificador único de cada organización.
          </p>
        </div>
      </div>
    </div>
  );
}
