import { NextRequest } from "next/server";
import { connectedClients, broadcastToAllClients } from "../sse/route";

// GET - Para o servidor monitorar status dos clientes
export async function GET() {
  return Response.json({
    connectedClients: connectedClients.size,
    clients: Array.from(connectedClients.values()),
  });
}

// POST - Para o servidor enviar comandos
export async function POST(request: NextRequest) {
  const body = await request.json();

  switch (body.type) {
    case "start_test":
      broadcastToAllClients({
        type: "start_test",
        data: body.config,
      });
      return Response.json({ success: true, message: "Teste iniciado" });

    case "stop_test":
      broadcastToAllClients({
        type: "stop_test",
      });
      return Response.json({ success: true, message: "Teste parado" });

    case "reset_test":
      broadcastToAllClients({
        type: "reset_test",
      });
      return Response.json({ success: true, message: "Teste resetado" });

    default:
      return Response.json(
        { success: false, message: "Tipo de ação não reconhecida" },
        { status: 400 }
      );
  }
}
