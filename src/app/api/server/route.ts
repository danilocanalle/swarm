import { NextRequest } from "next/server";
import { connectedClients, broadcastToAllClients } from "../sse/utils";
import { isValidToken } from "../auth/utils";

// Middleware de autenticação
function validateAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Token de autorização ausente" };
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  if (!isValidToken(token)) {
    return { valid: false, error: "Token inválido ou expirado" };
  }

  return { valid: true };
}

// GET - Para o servidor monitorar status dos clientes
export async function GET(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (!authCheck.valid) {
    return Response.json(
      { success: false, message: authCheck.error },
      { status: 401 }
    );
  }

  return Response.json({
    connectedClients: connectedClients.size,
    clients: Array.from(connectedClients.values()),
  });
}

// POST - Para o servidor enviar comandos
export async function POST(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (!authCheck.valid) {
    return Response.json(
      { success: false, message: authCheck.error },
      { status: 401 }
    );
  }

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
