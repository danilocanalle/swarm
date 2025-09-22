"use client";

import { useState, useEffect } from "react";
import styles from "./server.module.scss";

interface Client {
  id: string;
  status: "connected" | "disconnected" | "running" | "completed";
  requests: {
    total: number;
    completed: number;
    successful: number;
    failed: number;
  };
}

export default function ServerPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [beeCount, setBeeCount] = useState<number>(10);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Monitorar clientes via polling em vez de SSE
  useEffect(() => {
    setIsConnected(true);

    // Função para buscar status dos clientes
    const fetchClientsStatus = async () => {
      try {
        const response = await fetch("/api/server");
        const data = await response.json();
        setClients(
          data.clients.map((client: any) => ({
            id: client.id,
            status: client.status,
            requests: client.requests,
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar status dos clientes:", error);
        setIsConnected(false);
      }
    };

    // Buscar status inicial
    fetchClientsStatus();

    // Polling a cada 2 segundos
    const interval = setInterval(fetchClientsStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const startTest = async () => {
    if (!isConnected || !targetUrl || beeCount <= 0) {
      alert("Por favor, preencha todos os campos e verifique a conexão");
      return;
    }

    setIsRunning(true);

    // Enviar configuração para todos os clientes via API
    try {
      await fetch("/api/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "start_test",
          config: {
            beeCount,
            targetUrl,
          },
        }),
      });
    } catch (error) {
      console.error("Erro ao iniciar teste:", error);
      setIsRunning(false);
    }
  };

  const stopTest = async () => {
    try {
      await fetch("/api/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "stop_test" }),
      });
    } catch (error) {
      console.error("Erro ao parar teste:", error);
    }
    setIsRunning(false);
  };

  const resetTest = async () => {
    try {
      await fetch("/api/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reset_test" }),
      });
    } catch (error) {
      console.error("Erro ao resetar teste:", error);
    }
    setIsRunning(false);
    setClients((prev) =>
      prev.map((client) => ({
        ...client,
        status: "connected",
        requests: { total: 0, completed: 0, successful: 0, failed: 0 },
      }))
    );
  };

  const totalRequests = clients.reduce(
    (sum, client) => sum + client.requests.total,
    0
  );
  const completedRequests = clients.reduce(
    (sum, client) => sum + client.requests.completed,
    0
  );
  const successfulRequests = clients.reduce(
    (sum, client) => sum + client.requests.successful,
    0
  );
  const failedRequests = clients.reduce(
    (sum, client) => sum + client.requests.failed,
    0
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🐝 Swarm - Servidor de Controle</h1>
        <div className={styles.connectionStatus}>
          <span
            className={`${styles.status} ${
              isConnected ? styles.connected : styles.disconnected
            }`}
          >
            {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
          </span>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Painel de Configuração */}
        <section className={styles.configPanel}>
          <h2>⚙️ Configuração</h2>

          <div className={styles.configForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="beeCount">Número de Abelhas por Cliente:</label>
              <input
                id="beeCount"
                type="number"
                value={beeCount}
                onChange={(e) => setBeeCount(Number(e.target.value))}
                min="1"
                max="1000"
                disabled={isRunning}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="targetUrl">URL Alvo:</label>
              <input
                id="targetUrl"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://exemplo.com/api/endpoint"
                disabled={isRunning}
              />
            </div>

            <div className={styles.controls}>
              <button
                onClick={startTest}
                disabled={isRunning || !isConnected || !targetUrl}
                className={styles.startButton}
              >
                ▶️ Iniciar Teste
              </button>

              <button
                onClick={stopTest}
                disabled={!isRunning}
                className={styles.stopButton}
              >
                ⏹️ Parar Teste
              </button>

              <button onClick={resetTest} className={styles.resetButton}>
                🔄 Resetar
              </button>
            </div>
          </div>
        </section>

        {/* Estatísticas Globais */}
        <section className={styles.statsPanel}>
          <h2>📊 Estatísticas Globais</h2>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{clients.length}</span>
              <span className={styles.statLabel}>Clientes Conectados</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalRequests}</span>
              <span className={styles.statLabel}>Total de Requisições</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statNumber}>{completedRequests}</span>
              <span className={styles.statLabel}>Completadas</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statNumber}>{successfulRequests}</span>
              <span className={styles.statLabel}>Sucessos</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statNumber}>{failedRequests}</span>
              <span className={styles.statLabel}>Falhas</span>
            </div>
          </div>
        </section>

        {/* Lista de Clientes */}
        <section className={styles.clientsPanel}>
          <h2>👥 Clientes ({clients.length})</h2>

          {clients.length === 0 ? (
            <div className={styles.noClients}>
              <p>Nenhum cliente conectado</p>
              <p>
                Abra a página <code>/client</code> em outra aba ou navegador
              </p>
            </div>
          ) : (
            <div className={styles.clientsGrid}>
              {clients.map((client) => (
                <div key={client.id} className={styles.clientCard}>
                  <div className={styles.clientHeader}>
                    <h3>Cliente {client.id.slice(-8)}</h3>
                    <span
                      className={`${styles.clientStatus} ${
                        styles[client.status]
                      }`}
                    >
                      {client.status === "connected" && "🟢 Conectado"}
                      {client.status === "running" && "🟡 Executando"}
                      {client.status === "completed" && "✅ Completo"}
                      {client.status === "disconnected" && "🔴 Desconectado"}
                    </span>
                  </div>

                  <div className={styles.clientStats}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width:
                            client.requests.total > 0
                              ? `${
                                  (client.requests.completed /
                                    client.requests.total) *
                                  100
                                }%`
                              : "0%",
                        }}
                      />
                    </div>

                    <div className={styles.clientNumbers}>
                      <span>Total: {client.requests.total}</span>
                      <span>Completas: {client.requests.completed}</span>
                      <span className={styles.success}>
                        Sucessos: {client.requests.successful}
                      </span>
                      <span className={styles.error}>
                        Falhas: {client.requests.failed}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
