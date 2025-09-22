"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./client.module.scss";

interface BeeRequest {
  id: number;
  status: "waiting" | "loading" | "success" | "error";
  response?: {
    status: number;
    time: number;
    error?: string;
  };
}

interface TestConfig {
  beeCount: number;
  targetUrl: string;
  timeoutBetweenRequests?: number;
}

export default function ClientPage() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [clientId, setClientId] = useState<string>("");
  const [bees, setBees] = useState<BeeRequest[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
  });

  // Usar ref para manter sempre a referência atual do clientId
  const clientIdRef = useRef<string>("");

  // Ref para controlar o cancelamento de requisições
  const abortControllerRef = useRef<AbortController | null>(null);

  // Atualizar ref sempre que clientId mudar
  useEffect(() => {
    clientIdRef.current = clientId;
  }, [clientId]);

  // Função para enviar atualizações para o servidor
  const sendUpdateToServer = async (status: string, requests: any) => {
    const currentClientId = clientIdRef.current;

    if (!currentClientId) {
      console.log("ClientId não disponível ainda");
      return;
    }

    try {
      await fetch("/api/sse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client_update",
          clientId: currentClientId,
          data: {
            status,
            requests,
          },
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar atualização para servidor:", error);
    }
  };

  // Conectar ao SSE quando o componente monta
  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.onopen = () => {
      console.log("Conectado ao servidor SSE");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error("Erro ao processar mensagem SSE:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Erro no SSE:", error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleServerMessage = (data: any) => {
    console.log("Mensagem recebida:", data);

    switch (data.type) {
      case "client_id":
        setClientId(data.clientId);
        break;

      case "start_test":
        startTest(data.data);
        break;

      case "stop_test":
        stopTest();
        break;

      case "reset_test":
        resetTest();
        break;
    }
  };

  const startTest = (config: TestConfig) => {
    console.log("Iniciando teste com config:", config);
    setTestConfig(config);
    setIsRunning(true);

    // Criar abelhas (boxes) baseado na configuração
    const newBees: BeeRequest[] = Array.from(
      { length: config.beeCount },
      (_, index) => ({
        id: index + 1,
        status: "waiting",
      })
    );

    setBees(newBees);
    const newStats = {
      total: config.beeCount,
      completed: 0,
      successful: 0,
      failed: 0,
    };
    setStats(newStats);

    // Enviar atualização para o servidor
    sendUpdateToServer("running", newStats);

    // Criar novo AbortController para controlar as requisições
    abortControllerRef.current = new AbortController();

    // Iniciar execução das requisições com delay escalonado
    executeRequests(newBees, config);
  };

  const executeRequests = async (bees: BeeRequest[], config: TestConfig) => {
    try {
      // Usar o timeout configurado pelo servidor, ou 100ms como padrão
      const delayBetweenRequests = config.timeoutBetweenRequests || 100;

      // Executar todas as requisições com delays configurados
      const promises = bees.map((bee, index) =>
        executeRequest(
          bee,
          config.targetUrl,
          index * delayBetweenRequests,
          abortControllerRef.current?.signal
        )
      );

      await Promise.all(promises);
      setIsRunning(false);

      // Enviar atualização final para o servidor
      setTimeout(() => {
        setStats((currentStats) => {
          // Usar setTimeout para garantir que o ref foi atualizado
          setTimeout(() => sendUpdateToServer("completed", currentStats), 0);
          return currentStats;
        });
      }, 500); // Pequeno delay para garantir que stats foram atualizados
    } catch (error) {
      // Se todas as requisições foram canceladas, não é um erro real
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Requisições canceladas pelo usuário");
        setIsRunning(false);
      } else {
        console.error("Erro durante execução das requisições:", error);
        setIsRunning(false);
      }
    }
  };

  const executeRequest = async (
    bee: BeeRequest,
    targetUrl: string,
    delay: number,
    abortSignal?: AbortSignal
  ) => {
    try {
      // Aguardar delay inicial (mas verificar se foi cancelado)
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, delay);

        // Se o sinal de abort for acionado durante o delay
        if (abortSignal) {
          abortSignal.addEventListener("abort", () => {
            clearTimeout(timeoutId);
            reject(new Error("Request cancelled during delay"));
          });
        }
      });

      // Verificar se foi cancelado antes de prosseguir
      if (abortSignal?.aborted) {
        throw new Error("Request cancelled before execution");
      }

      // Marcar como loading
      setBees((prev) =>
        prev.map((b) => (b.id === bee.id ? { ...b, status: "loading" } : b))
      );

      const startTime = Date.now();

      // Primeiro tentar com CORS para poder ver status codes reais
      let response;
      let corsError = false;

      try {
        response = await fetch(targetUrl, {
          method: "GET",
          mode: "cors",
          signal: abortSignal, // Passar o signal para o fetch
        });
      } catch (corsErrorCaught) {
        // Se foi cancelado, propagar o erro
        if (
          corsErrorCaught instanceof Error &&
          corsErrorCaught.name === "AbortError"
        ) {
          throw corsErrorCaught;
        }

        console.log("CORS falhou, tentando no-cors:", corsErrorCaught);
        corsError = true;
        // Fallback para no-cors se CORS falhar
        response = await fetch(targetUrl, {
          method: "GET",
          mode: "no-cors",
          signal: abortSignal, // Passar o signal para o fetch
        });
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log("Response:", response);
      console.log("Status:", response.status);
      console.log("Type:", response.type);
      console.log("CORS Error:", corsError);

      let actualStatus = response.status;
      let isSuccess = true;
      let errorMessage = "";

      if (corsError || response.type === "opaque") {
        // Em modo no-cors ou resposta opaca, assumimos sucesso se não houve erro de rede
        actualStatus = 200;
        console.log("Resposta opaca ou CORS falhou - assumindo sucesso");
      } else if (response.status >= 400) {
        // Se conseguimos ver o status real e é um erro
        isSuccess = false;
        errorMessage = `HTTP ${response.status}`;
        console.log(`Erro HTTP detectado: ${response.status}`);
      }

      if (isSuccess) {
        // Marcar como sucesso
        setBees((prev) =>
          prev.map((b) =>
            b.id === bee.id
              ? {
                  ...b,
                  status: "success",
                  response: {
                    status: actualStatus,
                    time: responseTime,
                  },
                }
              : b
          )
        );

        // Atualizar estatísticas - sucesso
        setStats((prev) => {
          const newStats = {
            ...prev,
            completed: prev.completed + 1,
            successful: prev.successful + 1,
          };
          // Enviar atualização para o servidor de forma assíncrona
          setTimeout(() => sendUpdateToServer("running", newStats), 0);
          return newStats;
        });
      } else {
        // Marcar como erro (status HTTP de erro)
        setBees((prev) =>
          prev.map((b) =>
            b.id === bee.id
              ? {
                  ...b,
                  status: "error",
                  response: {
                    status: response.status,
                    time: responseTime,
                    error: errorMessage,
                  },
                }
              : b
          )
        );

        // Atualizar estatísticas - erro
        setStats((prev) => {
          const newStats = {
            ...prev,
            completed: prev.completed + 1,
            failed: prev.failed + 1,
          };
          // Enviar atualização para o servidor de forma assíncrona
          setTimeout(() => sendUpdateToServer("running", newStats), 0);
          return newStats;
        });
      }
    } catch (error) {
      // Se foi cancelado, marcar como waiting em vez de erro
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("cancelled"))
      ) {
        console.log(`Requisição #${bee.id} cancelada`);

        setBees((prev) =>
          prev.map((b) => (b.id === bee.id ? { ...b, status: "waiting" } : b))
        );

        // Não atualizar estatísticas para requisições canceladas
        return;
      }

      console.log("Erro de rede capturado:", error);

      // Para erros de rede, precisamos calcular o tempo sem o startTime
      const endTime = Date.now();
      const responseTime = endTime - Date.now(); // Será 0 ou próximo de 0

      // Marcar como erro (erro de rede/conexão)
      setBees((prev) =>
        prev.map((b) =>
          b.id === bee.id
            ? {
                ...b,
                status: "error",
                response: {
                  status: 0,
                  time: responseTime,
                  error:
                    error instanceof Error ? error.message : "Erro de rede",
                },
              }
            : b
        )
      );

      // Atualizar estatísticas - erro de rede
      setStats((prev) => {
        const newStats = {
          ...prev,
          completed: prev.completed + 1,
          failed: prev.failed + 1,
        };
        // Enviar atualização para o servidor de forma assíncrona
        setTimeout(() => sendUpdateToServer("running", newStats), 0);
        return newStats;
      });
    }
  };

  const stopTest = () => {
    console.log("Parando teste");
    setIsRunning(false);

    // Cancelar todas as requisições em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Requisições canceladas");
    }

    // Parar requisições pendentes marcando como waiting
    setBees((prev) =>
      prev.map((bee) =>
        bee.status === "loading" ? { ...bee, status: "waiting" } : bee
      )
    );

    // Enviar atualização para o servidor
    setTimeout(() => {
      setStats((currentStats) => {
        // Usar setTimeout para garantir que o ref foi atualizado
        setTimeout(() => sendUpdateToServer("connected", currentStats), 0);
        return currentStats;
      });
    }, 100);
  };

  const resetTest = () => {
    console.log("Resetando teste");
    setIsRunning(false);
    setBees([]);
    setTestConfig(null);
    const resetStats = {
      total: 0,
      completed: 0,
      successful: 0,
      failed: 0,
    };
    setStats(resetStats);

    // Enviar atualização para o servidor
    sendUpdateToServer("connected", resetStats);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return "⚪";
      case "loading":
        return "🟡";
      case "success":
        return "🟢";
      case "error":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Aguardando";
      case "loading":
        return "Executando";
      case "success":
        return "Sucesso";
      case "error":
        return "Erro";
      default:
        return "Aguardando";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🐝 Swarm - Cliente de Execução</h1>
        <div className={styles.clientInfo}>
          <div className={styles.connectionStatus}>
            <span
              className={`${styles.status} ${
                isConnected ? styles.connected : styles.disconnected
              }`}
            >
              {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
            </span>
          </div>
          {clientId && (
            <div className={styles.clientId}>
              <span>ID: {clientId.slice(-8)}</span>
            </div>
          )}
        </div>
      </header>

      <div className={styles.mainContent}>
        {!testConfig ? (
          // Estado inicial - aguardando configuração
          <div className={styles.waitingState}>
            <div className={styles.waitingIcon}>⏳</div>
            <h2>Aguardando comandos do servidor...</h2>
            <p>Este cliente está conectado e pronto para receber instruções.</p>
            <div className={styles.instructions}>
              <p>Para iniciar um teste:</p>
              <ol>
                <li>
                  Acesse a página <code>/server</code>
                </li>
                <li>Configure o número de abelhas e URL alvo</li>
                <li>Clique em "Soltar abelhas"</li>
              </ol>
            </div>
          </div>
        ) : (
          // Estado de teste - mostrando abelhas
          <div className={styles.testState}>
            {/* Configuração do teste */}
            <section className={styles.configDisplay}>
              <h2>📋 Configuração do Teste</h2>
              <div className={styles.configInfo}>
                <div className={styles.configItem}>
                  <label>Número de Abelhas:</label>
                  <span>{testConfig.beeCount}</span>
                </div>
                <div className={styles.configItem}>
                  <label>URL Alvo:</label>
                  <span>{testConfig.targetUrl}</span>
                </div>
                <div className={styles.configItem}>
                  <label>Timeout entre Requisições:</label>
                  <span>{testConfig.timeoutBetweenRequests || 100}ms</span>
                </div>
                <div className={styles.configItem}>
                  <label>Status:</label>
                  <span className={isRunning ? styles.running : styles.idle}>
                    {isRunning ? "🔄 Executando" : "⏸️ Parado"}
                  </span>
                </div>
              </div>
            </section>

            {/* Estatísticas */}
            <section className={styles.statsPanel}>
              <h2>📊 Estatísticas</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{stats.total}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{stats.completed}</span>
                  <span className={styles.statLabel}>Completadas</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{stats.successful}</span>
                  <span className={styles.statLabel}>Sucessos</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{stats.failed}</span>
                  <span className={styles.statLabel}>Falhas</span>
                </div>
              </div>
            </section>

            {/* Grid de Abelhas */}
            <section className={styles.beesPanel}>
              <h2>🐝 Abelhas ({bees.length})</h2>
              <div className={styles.beesGrid}>
                {bees.map((bee) => (
                  <div
                    key={bee.id}
                    className={`${styles.beeCard} ${styles[bee.status]}`}
                  >
                    <div className={styles.beeHeader}>
                      <span className={styles.beeIcon}>
                        {getStatusIcon(bee.status)}
                      </span>
                      <span className={styles.beeId}>#{bee.id}</span>
                    </div>

                    <div className={styles.beeStatus}>
                      {getStatusText(bee.status)}
                    </div>

                    {bee.response && (
                      <div className={styles.beeDetails}>
                        <div className={styles.responseTime}>
                          ⏱️ {bee.response.time}ms
                        </div>
                        {bee.status === "success" && (
                          <div className={styles.statusCode}>
                            📊 {bee.response.status}
                          </div>
                        )}
                        {bee.status === "error" && bee.response.error && (
                          <div
                            className={styles.errorMessage}
                            title={bee.response.error}
                          >
                            ❌ {bee.response.error.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
