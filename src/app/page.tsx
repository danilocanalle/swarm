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
              métodos HTTP (GET/POST), use dados dinâmicos com Faker.js, e
              acompanhe o progresso em tempo real.
            </p>
            <span className={styles.cardAction}>Acessar Servidor →</span>
          </Link>

          <Link href="/client" className={styles.card}>
            <h2>🔗 Cliente de Execução</h2>
            <p>
              Interface do cliente que se conecta ao servidor via EventSource
              (SSE) e executa requisições GET/POST com dados únicos gerados
              automaticamente pelo Faker.js.
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
            <li>� Suporte para métodos GET e POST</li>
            <li>🎭 Geração de dados dinâmicos com Faker.js</li>
            <li>📝 Placeholders para dados realistas (nome, email, etc.)</li>
            <li>🔐 Sistema de autenticação protegido</li>
            <li>�📈 Feedback visual instantâneo</li>
            <li>💬 Comunicação via EventSource (Server-Sent Events)</li>
            <li>🔄 Reconexão automática em caso de falha</li>
          </ul>
        </div>

        <div className={styles.fakerSection}>
          <h3>🎭 Placeholders Faker Disponíveis</h3>
          <p>
            Use estes placeholders no corpo da requisição POST para gerar dados
            únicos:
          </p>
          <div className={styles.fakerExamples}>
            <div className={styles.fakerCategory}>
              <strong>👤 Pessoa:</strong> FAKER.NAME, FAKER.EMAIL, FAKER.PHONE
            </div>
            <div className={styles.fakerCategory}>
              <strong>🏢 Empresa:</strong> FAKER.COMPANY, FAKER.PRODUCT,
              FAKER.PRICE
            </div>
            <div className={styles.fakerCategory}>
              <strong>🔢 Dados:</strong> FAKER.UUID, FAKER.NUMBER, FAKER.BOOLEAN
            </div>
            <div className={styles.fakerCategory}>
              <strong>📍 Local:</strong> FAKER.ADDRESS, FAKER.CITY,
              FAKER.COUNTRY
            </div>
          </div>
          <div className={styles.fakerExample}>
            <strong>Exemplo:</strong>
            <code>
              {"{"}"_id": "FAKER.UUID", "name": "FAKER.NAME", "email":
              "FAKER.EMAIL"{"}"}
            </code>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Desenvolvido por Danilo Canalle | MIT License</p>
      </footer>
    </div>
  );
}
