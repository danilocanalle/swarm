import Link from "next/link";
import styles from "./page.module.css";
import "./globals.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>🐝 Swarm</h1>
          <p className={styles.subtitle}>
            Sistema de Teste de Carga Distribuído
          </p>
        </div>

        <div className={styles.description}>
          <p>
            O Swarm permite coordenar múltiplos clientes para realizar
            requisições simultâneas contra uma URL alvo, proporcionando testes
            de carga distribuídos eficientes.
          </p>
        </div>

        <div className={styles.cards}>
          <Link href="/server" className={styles.card}>
            <h2>🖥️ Servidor de Controle</h2>
            <p>
              Interface para gerenciar e monitorar os testes de carga. Configure
              parâmetros, visualize clientes conectados e acompanhe o progresso
              em tempo real.
            </p>
            <span className={styles.cardAction}>Acessar Servidor →</span>
          </Link>

          <Link href="/client" className={styles.card}>
            <h2>🔗 Cliente de Execução</h2>
            <p>
              Interface do cliente que se conecta ao servidor via EventSource
              (SSE) e executa as requisições conforme comandos recebidos.
            </p>
            <span className={styles.cardAction}>Conectar Cliente →</span>
          </Link>
        </div>

        <div className={styles.features}>
          <h3>✨ Funcionalidades</h3>
          <ul>
            <li>📊 Monitoramento de clientes em tempo real</li>
            <li>🐝 Configuração flexível de "abelhas" (requisições)</li>
            <li>🎯 Teste de qualquer URL alvo</li>
            <li>📈 Feedback visual instantâneo</li>
            <li>� Comunicação via EventSource (Server-Sent Events)</li>
            <li>🔄 Reconexão automática em caso de falha</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Desenvolvido por Danilo Canalle | MIT License</p>
      </footer>
    </div>
  );
}
