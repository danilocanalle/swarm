// Armazenar conexões SSE ativas
export const connections = new Map<string, WritableStreamDefaultWriter>();

// Interface para as mensagens
interface Message {
  type: string;
  clientId?: string;
  data?: any;
  timestamp?: number;
}

export function broadcastToAllClients(message: Message) {
  const messageStr = JSON.stringify(message);
  connections.forEach((writer, clientId) => {
    try {
      writer.write(`data: ${messageStr}\n\n`);
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${clientId}:`, error);
      connections.delete(clientId);
    }
  });
}

// Lista de clientes conectados para o servidor monitorar
export const connectedClients = new Map<
  string,
  {
    id: string;
    connectedAt: Date;
    status: "connected" | "running" | "completed";
    requests: {
      total: number;
      completed: number;
      successful: number;
      failed: number;
    };
    averageResponseTime: number;
    lastPong?: Date;
  }
>();

export function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15);
}
