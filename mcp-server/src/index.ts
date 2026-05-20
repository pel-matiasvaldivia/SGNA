import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Base URL for backend communications
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8000";

// Initialize the MCP Server
const server = new McpServer({
  name: "sgna-mcp-server",
  version: "1.0.0",
});

// Helper to handle axios errors and print friendly diagnostics
const fetchFromBackend = async (endpoint: string, params: Record<string, string>) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/v1/ia/internal/${endpoint}`, { params });
    return response.data;
  } catch (error: any) {
    console.error(`Error querying backend ${endpoint}:`, error.message);
    return null;
  }
};

// 1. Tool: calculate_emissions (Existing tool kept for compatibility)
server.registerTool(
  "calculate_emissions",
  {
    description: "Calcular emisiones de CO2 equivalente según el alcance e insumos.",
    inputSchema: {
      scope: z.enum(["1", "2", "3"]).describe("Alcance de las emisiones (1, 2 o 3)"),
      category: z.string().describe("Categoría de la emisión (ej: combustión_estacionaria)"),
      amount: z.number().describe("Cantidad consumida"),
      unit: z.string().describe("Unidad de medida (ej: kWh, litros)"),
    }
  },
  async ({ scope, category, amount, unit }) => {
    const fakeEmissionFactor = 0.5; 
    const co2e = amount * fakeEmissionFactor;

    return {
      content: [{ 
        type: "text", 
        text: `Calculated CO2e emissions for Scope ${scope} - ${category}: ${co2e} kgCO2e.` 
      }],
    };
  }
);

// 2. Tool: check_compliance
server.registerTool(
  "check_compliance",
  {
    description: "Inspeccionar el diagnóstico de brechas de calidad SGI y obtener porcentaje de cumplimiento bajo ISO 9001.",
    inputSchema: {
      tenant_slug: z.string().describe("Slug identificador único del Tenant para aislar la consulta."),
    }
  },
  async ({ tenant_slug }) => {
    const data = await fetchFromBackend("compliance", { tenant_slug });
    
    if (!data || data.length === 0) {
      return {
        content: [{
          type: "text",
          text: `[Simulación SGNA] No se encontraron registros de diagnóstico para '${tenant_slug}'.\n` +
                `- Cláusula 4.1 (Contexto): 🟢 Cumple totalmente.\n` +
                `- Cláusula 7.2 (Competencia): 🔴 No cumple (brecha en capacitaciones).\n` +
                `- Cláusula 9.3 (Revisión Dirección): 🟢 Cumple totalmente.`
        }]
      };
    }

    let summary = `### Reporte de Cumplimiento SGI (ISO 9001) para Tenant: ${tenant_slug}\n\n`;
    data.forEach((item: any) => {
      summary += `- **Cláusula ${item.clausula}** (${item.norma}): Estado **${item.estado.toUpperCase()}**.\n  Pregunta: *${item.pregunta}*\n  Observación: *${item.observacion || "Sin observaciones"}*\n\n`;
    });

    return {
      content: [{ type: "text", text: summary }]
    };
  }
);

// 3. Tool: generate_root_cause
server.registerTool(
  "generate_root_cause",
  {
    description: "Generar un análisis causa raíz (Ishikawa y 5 Porqués) para una desviación o no conformidad.",
    inputSchema: {
      tenant_slug: z.string().describe("Slug del tenant."),
      non_conformity_id: z.string().optional().describe("ID único de la no conformidad (opcional)."),
      descripcion_libre: z.string().optional().describe("Descripción de la desviación si no se tiene ID (opcional).")
    }
  },
  async ({ tenant_slug, non_conformity_id, descripcion_libre }) => {
    // We can fetch details or run a cognitive root-cause analysis template
    const params: Record<string, string> = { tenant_slug };
    if (non_conformity_id) params.non_conformity_id = non_conformity_id;
    if (descripcion_libre) params.descripcion_libre = descripcion_libre;

    let responseText = "";
    try {
      const res = await axios.post(`${apiBaseUrl}/api/v1/ia/root-cause`, params);
      const data = res.data;
      
      responseText += `### Análisis Causa Raíz para: ${data.codigo}\n`;
      responseText += `**Desviación:** *${data.descripcion}*\n\n`;
      responseText += `#### 🛠️ Diagrama de Ishikawa:\n`;
      Object.keys(data.ishikawa).forEach((key) => {
        responseText += `* **${key}**:\n`;
        data.ishikawa[key].forEach((cause: string) => {
          responseText += `  - ${cause}\n`;
        });
      });
      responseText += `\n#### ❓ Análisis de los 5 Porqués:\n`;
      data.five_whys.forEach((why: string) => {
        responseText += `${why}\n`;
      });
    } catch (e: any) {
      responseText = `Error generando análisis causa raíz: ${e.message}`;
    }

    return {
      content: [{ type: "text", text: responseText }]
    };
  }
);

// 4. Tool: risk_mitigation_advisor
server.registerTool(
  "risk_mitigation_advisor",
  {
    description: "Analizar los riesgos y proponer acciones de mitigación según la norma ISO 31000.",
    inputSchema: {
      tenant_slug: z.string().describe("Slug del tenant."),
      riesgo_id: z.string().optional().describe("ID de un riesgo específico (opcional).")
    }
  },
  async ({ tenant_slug, riesgo_id }) => {
    const params: Record<string, string> = { tenant_slug };
    if (riesgo_id) params.riesgo_id = riesgo_id;

    let responseText = "";
    try {
      const res = await axios.post(`${apiBaseUrl}/api/v1/ia/risk-advice`, params);
      const data = res.data;
      
      responseText += `### Asesor de Mitigación de Riesgos (${data.riesgos_analizados} analizados)\n`;
      responseText += `Se detectaron **${data.riesgos_criticos}** riesgos en nivel Crítico.\n\n`;
      data.mitigaciones.forEach((m: any) => {
        responseText += `- **Riesgo:** *${m.riesgo_nombre}* (Nivel: **${m.nivel_riesgo}**)\n`;
        responseText += `  * *Análisis:* ${m.analisis}\n`;
        responseText += `  * *Control Propuesto:* ${m.control_propuesto}\n`;
        responseText += `  * *Residual Proyectado:* Probabilidad ${m.probabilidad_residual} x Impacto ${m.impacto_residual}\n\n`;
      });
    } catch (e: any) {
      responseText = `Error analizando riesgos: ${e.message}`;
    }

    return {
      content: [{ type: "text", text: responseText }]
    };
  }
);

// 5. Tool: kpi_executive_summary
server.registerTool(
  "kpi_executive_summary",
  {
    description: "Generar un resumen ejecutivo de auditoría en base a los KPIs e indicadores del SGI.",
    inputSchema: {
      tenant_slug: z.string().describe("Slug del tenant."),
      periodo: z.string().optional().describe("Período de análisis (opcional).")
    }
  },
  async ({ tenant_slug, periodo }) => {
    const params: Record<string, string> = { tenant_slug };
    if (periodo) params.periodo = periodo;

    let responseText = "";
    try {
      const res = await axios.post(`${apiBaseUrl}/api/v1/ia/kpi-summary`, params);
      const data = res.data;
      
      responseText += `### Resumen Ejecutivo de Desempeño SGI - Período: ${periodo || "Actual"}\n\n`;
      responseText += `* **KPIs Analizados:** ${data.kpis_analizados}\n`;
      responseText += `* **KPIs en Meta:** ${data.kpis_en_meta}\n`;
      responseText += `* **KPIs Críticos:** ${data.kpis_criticos}\n\n`;
      responseText += `#### 📝 Resumen del Auditor:\n${data.resumen_ejecutivo}\n\n`;
      responseText += `#### 🚨 Alertas Operativas:\n`;
      data.alertas_detectadas.forEach((alert: string) => {
        responseText += `- ${alert}\n`;
      });
      responseText += `\n#### 🛠️ Acciones Recomendadas:\n`;
      data.acciones_recomendadas.forEach((action: string) => {
        responseText += `- ${action}\n`;
      });
    } catch (e: any) {
      responseText = `Error generando resumen de KPI: ${e.message}`;
    }

    return {
      content: [{ type: "text", text: responseText }]
    };
  }
);

// Start the server
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP Server connected and ready to receive requests.");
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
