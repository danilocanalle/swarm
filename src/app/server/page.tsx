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
  averageResponseTime: number;
}

export default function ServerPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [beeCount, setBeeCount] = useState<number>(10);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [httpMethod, setHttpMethod] = useState<"GET" | "POST">("GET");
  const [requestBody, setRequestBody] = useState<string>("");
  const [timeoutBetweenRequests, setTimeoutBetweenRequests] =
    useState<number>(100);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // Monitorar clientes via polling em vez de SSE
  useEffect(() => {
    setIsConnected(true);

    // Função para buscar status dos clientes
    const fetchClientsStatus = async () => {
      try {
        const response = await fetch("/api/server", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setClients(
          data.clients.map((client: any) => ({
            id: client.id,
            status: client.status,
            requests: client.requests,
            averageResponseTime: client.averageResponseTime || 0,
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar status dos clientes:", error);
        setIsConnected(false);

        // Se erro de autenticação, fazer logout
        if (error instanceof Error && error.message.includes("401")) {
          handleLogout();
        }
      }
    };

    // Buscar status inicial apenas se autenticado
    if (authToken) {
      fetchClientsStatus();

      // Polling a cada 2 segundos
      const interval = setInterval(fetchClientsStatus, 2000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [authToken]);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "validate",
          token: token,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAuthToken(token);
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Erro ao validar token:", error);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          password: password,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAuthToken(data.token);
        setPassword("");
        localStorage.setItem("authToken", data.token);
      } else {
        setLoginError(data.message || "Senha incorreta");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setLoginError("Erro de conexão");
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "logout",
            token: authToken,
          }),
        });
      }
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setIsAuthenticated(false);
      setAuthToken("");
      localStorage.removeItem("authToken");
    }
  };

  const startTest = async () => {
    if (
      !isConnected ||
      !targetUrl ||
      beeCount <= 0 ||
      timeoutBetweenRequests < 0
    ) {
      alert(
        "Por favor, preencha todos os campos corretamente e verifique a conexão"
      );
      return;
    }

    setIsRunning(true);

    // Enviar configuração para todos os clientes via API
    try {
      await fetch("/api/server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: "start_test",
          config: {
            beeCount,
            targetUrl,
            httpMethod,
            requestBody: httpMethod === "POST" ? requestBody : undefined,
            timeoutBetweenRequests,
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
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
        averageResponseTime: 0,
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

  // Calcular tempo médio geral ponderado
  const totalAverageResponseTime = clients.reduce((total, client) => {
    if (client.requests.completed > 0) {
      return total + client.averageResponseTime * client.requests.completed;
    }
    return total;
  }, 0);
  const globalAverageResponseTime =
    completedRequests > 0
      ? Math.round(totalAverageResponseTime / completedRequests)
      : 0;

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1>🐝 Swarm Server</h1>
            <p>Acesso restrito ao painel de controle</p>
          </div>

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Senha de acesso:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                required
                className={styles.passwordInput}
              />
            </div>

            {loginError && (
              <div className={styles.loginError}>⚠️ {loginError}</div>
            )}

            <button
              type="submit"
              className={styles.loginButton}
              disabled={!password.trim()}
            >
              🔓 Entrar
            </button>
          </form>

          <div className={styles.loginFooter}>
            <small>Sistema de teste de carga distribuído</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>🐝 Swarm Server</h1>
          <div
            className={`${styles.connectionStatus} ${
              isConnected ? styles.connected : styles.disconnected
            }`}
          >
            {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.userInfo}>Autenticado</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>
      </header>

      <div className={styles.content}>
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

            <div className={styles.inputGroup}>
              <label htmlFor="httpMethod">Método HTTP:</label>
              <select
                id="httpMethod"
                value={httpMethod}
                onChange={(e) =>
                  setHttpMethod(e.target.value as "GET" | "POST")
                }
                disabled={isRunning}
                className={styles.selectInput}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            {httpMethod === "POST" && (
              <div className={styles.inputGroup}>
                <label htmlFor="requestBody">Corpo da Requisição (JSON):</label>
                <textarea
                  id="requestBody"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='{"exemplo": "dados", "teste": true}'
                  disabled={isRunning}
                  className={styles.textareaInput}
                  rows={4}
                />
                <small>
                  Digite o JSON que será enviado no corpo da requisição POST.
                  Use placeholders FAKER para gerar dados dinâmicos.
                </small>

                <details className={styles.fakerHelp}>
                  <summary>📝 Placeholders Faker Disponíveis</summary>
                  <div className={styles.fakerGrid}>
                    <div className={styles.fakerCategory}>
                      <h4>👤 Pessoa</h4>
                      <code>FAKER.NAME</code> - Nome completo
                      <br />
                      <code>FAKER.FIRSTNAME</code> - Primeiro nome
                      <br />
                      <code>FAKER.LASTNAME</code> - Sobrenome
                      <br />
                      <code>FAKER.EMAIL</code> - Email
                      <br />
                      <code>FAKER.PHONE</code> - Telefone
                      <br />
                      <code>FAKER.JOB</code> - Profissão
                    </div>

                    <div className={styles.fakerCategory}>
                      <h4>🏢 Empresa</h4>
                      <code>FAKER.COMPANY</code> - Nome da empresa
                      <br />
                      <code>FAKER.PRODUCT</code> - Nome do produto
                      <br />
                      <code>FAKER.PRICE</code> - Preço
                    </div>

                    <div className={styles.fakerCategory}>
                      <h4>📍 Localização</h4>
                      <code>FAKER.ADDRESS</code> - Endereço
                      <br />
                      <code>FAKER.CITY</code> - Cidade
                      <br />
                      <code>FAKER.COUNTRY</code> - País
                      <br />
                      <code>FAKER.ZIPCODE</code> - CEP
                    </div>

                    <div className={styles.fakerCategory}>
                      <h4>🔢 Dados</h4>
                      <code>FAKER.UUID</code> - ID único
                      <br />
                      <code>FAKER.NUMBER</code> - Número inteiro
                      <br />
                      <code>FAKER.FLOAT</code> - Número decimal
                      <br />
                      <code>FAKER.BOOLEAN</code> - Verdadeiro/Falso
                      <br />
                      <code>FAKER.DATE</code> - Data
                    </div>

                    <div className={styles.fakerCategory}>
                      <h4>💻 Internet</h4>
                      <code>FAKER.URL</code> - URL
                      <br />
                      <code>FAKER.USERNAME</code> - Nome de usuário
                      <br />
                      <code>FAKER.PASSWORD</code> - Senha
                      <br />
                      <code>FAKER.CREDITCARD</code> - Cartão
                    </div>

                    <div className={styles.fakerCategory}>
                      <h4>📝 Texto</h4>
                      <code>FAKER.WORD</code> - Palavra
                      <br />
                      <code>FAKER.SENTENCE</code> - Frase
                      <br />
                      <code>FAKER.PARAGRAPH</code> - Parágrafo
                      <br />
                      <code>FAKER.COLOR</code> - Cor
                    </div>
                  </div>
                </details>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="timeoutBetweenRequests">
                Timeout entre Requisições (ms):
              </label>
              <input
                id="timeoutBetweenRequests"
                type="number"
                value={timeoutBetweenRequests}
                onChange={(e) =>
                  setTimeoutBetweenRequests(Number(e.target.value))
                }
                min="0"
                max="10000"
                step="50"
                disabled={isRunning}
                placeholder="100"
              />
              <small>
                Delay em milissegundos entre cada requisição do cliente
              </small>
            </div>

            <div className={styles.controls}>
              <button
                onClick={startTest}
                disabled={isRunning || !isConnected || !targetUrl}
                className={styles.startButton}
              >
                🐝 Soltar abelhas
              </button>

              <button
                onClick={stopTest}
                disabled={!isRunning}
                className={styles.stopButton}
              >
                Matar abelhas
              </button>

              <button onClick={resetTest} className={styles.resetButton}>
                Resetar
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

            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {globalAverageResponseTime}ms
              </span>
              <span className={styles.statLabel}>Tempo Médio</span>
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
                      <span className={styles.responseTime}>
                        Tempo Médio: {client.averageResponseTime}ms
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
