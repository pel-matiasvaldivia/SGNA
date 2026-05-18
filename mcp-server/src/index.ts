import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Initialize the MCP Server
const server = new McpServer({
  name: "sgna-mcp-server",
  version: "1.0.0",
});

// Example tool: calculate_emissions
server.tool(
  "calculate_emissions",
  {
    scope: z.enum(["1", "2", "3"]).describe("Scope of emissions"),
    category: z.string().describe("Category of emissions (e.g., stationary_combustion)"),
    amount: z.number().describe("Amount consumed"),
    unit: z.string().describe("Unit of measurement (e.g., kWh, liters)"),
  },
  async ({ scope, category, amount, unit }) => {
    // In a real implementation, this would fetch the emission factor from the API or local resource
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
