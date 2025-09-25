import { NextRequest } from "next/server";
import {
  connections,
  broadcastToAllClients,
  connectedClients,
  generateClientId,
} from "./utils";

// GET - Para conexões SSE dos clientes (não do servidor)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const clientType = url.searchParams.get("type");

  // Se for o servidor pedindo status, retornar JSON
  if (clientType === "server") {
    return Response.json({
      connectedClients: connectedClients.size,
      clients: Array.from(connectedClients.values()),
    });
  }

  // Caso contrário, é um cliente real conectando via SSE
  const clientId = generateClientId();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Armazenar a conexão
      connections.set(clientId, {
        write: (data: string) => {
          controller.enqueue(encoder.encode(data));
        },
      } as any);

      // Adicionar cliente à lista
      connectedClients.set(clientId, {
        id: clientId,
        connectedAt: new Date(),
        status: "connected",
        requests: {
          total: 0,
          completed: 0,
          successful: 0,
          failed: 0,
        },
        averageResponseTime: 0,
      });

      // Enviar ID do cliente
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "client_id",
            clientId,
          })}\n\n`
        )
      );

      console.log(`Cliente conectado via SSE: ${clientId}`);
    },

    cancel() {
      // Cliente desconectou
      connections.delete(clientId);
      connectedClients.delete(clientId);
      console.log(`Cliente desconectado: ${clientId}`);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// POST - Para enviar comandos para os clientes
export async function POST(request: NextRequest) {
  const body = await request.json();

  switch (body.type) {
    case "start_test":
      // Atualizar status de todos os clientes para "running" e definir total de requests
      connectedClients.forEach((client, clientId) => {
        connectedClients.set(clientId, {
          ...client,
          status: "running",
          requests: {
            total: body.config.beeCount,
            completed: 0,
            successful: 0,
            failed: 0,
          },
          averageResponseTime: 0,
        });
      });

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
      // Resetar status de todos os clientes
      connectedClients.forEach((client, clientId) => {
        connectedClients.set(clientId, {
          ...client,
          status: "connected",
          requests: {
            total: 0,
            completed: 0,
            successful: 0,
            failed: 0,
          },
          averageResponseTime: 0,
        });
      });

      broadcastToAllClients({
        type: "reset_test",
      });
      return Response.json({ success: true, message: "Teste resetado" });

    case "client_update":
      // Atualizar status do cliente no servidor
      const clientData = connectedClients.get(body.clientId);
      if (clientData) {
        // Atualizar dados do cliente
        connectedClients.set(body.clientId, {
          ...clientData,
          status: body.data.status || clientData.status,
          requests: {
            ...clientData.requests,
            ...body.data.requests,
          },
          averageResponseTime:
            body.data.requests?.averageResponseTime ||
            clientData.averageResponseTime,
        });
        console.log(
          `Status atualizado para cliente ${body.clientId}:`,
          body.data
        );
      }
      return Response.json({ success: true });

    case "pong":
      // Cliente respondeu ao ping - atualizar timestamp de última resposta
      const pongClientData = connectedClients.get(body.clientId);
      if (pongClientData) {
        connectedClients.set(body.clientId, {
          ...pongClientData,
          lastPong: new Date(),
        });
        // console.log(`PONG recebido do cliente ${body.clientId}`);
      }
      return Response.json({ success: true });

    case "get_status":
      return Response.json({
        connectedClients: connections.size,
        clients: Array.from(connections.keys()),
      });

    default:
      return Response.json(
        { success: false, message: "Tipo de ação não reconhecida" },
        { status: 400 }
      );
  }
}
