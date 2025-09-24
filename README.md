# Swarm - Sistema de Teste de Carga Distribuído

O Swarm é um sistema de teste de carga distribuído que permite coordenar múltiplos clientes para realizar requisições simultâneas contra uma URL alvo. O sistema é composto por duas partes principais: um servidor de controle e clientes que executam as requisições.

## 🏗️ Arquitetura

O projeto é uma aplicação Next.js única com duas páginas principais:

### `/server` - Página do Servidor de Controle

- Interface web para controle e monitoramento
- Gerenciamento de conexões EventSource (SSE) com clientes
- Configuração de parâmetros de teste
- Visualização em tempo real do status dos clientes

### `/client` - Página do Cliente de Execução

- Interface que se conecta ao servidor via EventSource (Server-Sent Events)
- Executa requisições HTTP conforme comandos do servidor
- Relatório de status (sucesso/erro) de volta ao servidor via HTTP POST

## ✨ Funcionalidades

### Servidor

- 📊 **Monitoramento de Clientes**: Exibe quantidade de clientes conectados
- 🐝 **Configuração de "Abelhas"**: Define quantas requisições cada cliente deve fazer
- 🎯 **URL Alvo**: Configuração da URL que será testada
- 🔄 **Métodos HTTP**: Suporte para requisições GET e POST
- 📝 **Corpo da Requisição**: Campo para configurar payload JSON (somente POST)
- 🎭 **Placeholders Faker**: Sistema de geração de dados dinâmicos usando Faker.js
- ▶️ **Controle de Execução**: Botão para iniciar o teste de carga
- 📈 **Feedback em Tempo Real**: Box individual para cada cliente mostrando o status
- 🔐 **Sistema de Autenticação**: Proteção por senha para acesso ao painel de controle

### Cliente

- 🔌 **Conexão EventSource**: Aguarda e mantém conexão SSE com o servidor
- 🎨 **Interface Dinâmica**: Layout muda após estabelecer conexão
- 📦 **Visualização de Tarefas**: Boxes representando cada requisição a ser feita
- ⏳ **Estados Visuais**: Loading, sucesso e erro para cada requisição
- 🔄 **Requisições Dinâmicas**: Executa tanto GET quanto POST conforme configuração
- 🎭 **Processamento Faker**: Substitui placeholders por dados falsos únicos para cada requisição
- 📊 **Exibição de Configuração**: Mostra método HTTP e corpo da requisição (se POST)
- 💬 **Comunicação Híbrida**: Recebe comandos via SSE, envia feedback via HTTP POST
- 🔁 **Reconexão Automática**: Reconecta automaticamente se a conexão cair

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- npm/yarn/pnpm

### Aplicação

```bash
npm install
npm run dev
```

Acesse as páginas:

- **Servidor**: `http://localhost:3000/server`
- **Cliente**: `http://localhost:3000/client`

## 🔧 Tecnologias Utilizadas

- **Frontend**: Next.js, React, TypeScript
- **Comunicação**: EventSource (Server-Sent Events) + HTTP POST
- **Styling**: SCSS Modules
- **Build**: Next.js Build System

## 🏗️ Arquitetura de Comunicação

O projeto utiliza uma arquitetura híbrida para comunicação cliente-servidor:

### 📡 EventSource (Server-Sent Events)

- **Servidor → Cliente**: Comandos de controle (`start_test`, `stop_test`, `reset_test`)
- **Vantagens**:
  - Reconexão automática
  - Simples de implementar
  - Suporte nativo do navegador
  - Ideal para comandos unidirecionais

### 🔄 HTTP POST

- **Cliente → Servidor**: Atualizações de status e estatísticas
- **Vantagens**:
  - Controle fino sobre quando enviar dados
  - Melhor para dados estruturados
  - Não mantém conexão aberta constantemente

Esta combinação oferece o melhor dos dois mundos: simplicidade do SSE para comandos e flexibilidade do HTTP para atualizações.

## 📋 Fluxo de Funcionamento

1. **Inicialização**: Aplicação Next.js é iniciada
2. **Acesso às Páginas**: Usuários acessam `/server` e `/client` em navegadores diferentes
3. **Conexão**: Clientes se conectam ao servidor via EventSource (SSE)
4. **Configuração**: Operador define parâmetros na página do servidor:
   - Número de "abelhas" (requisições) por cliente
   - URL alvo para teste
   - Timeout entre requisições
5. **Distribuição**: Servidor envia configuração para todos os clientes conectados via SSE
6. **Execução**: Servidor dispara comando de início via SSE
7. **Monitoramento**: Clientes enviam atualizações de progresso via HTTP POST
8. **Visualização**: Interface mostra progresso em tempo real
9. **Relatório**: Resultados consolidados são exibidos

## � Placeholders Faker

O sistema suporta geração dinâmica de dados usando a biblioteca Faker.js. No corpo da requisição POST, você pode usar os seguintes placeholders:

### 👤 Dados Pessoais

- `FAKER.NAME` - Nome completo
- `FAKER.FIRSTNAME` - Primeiro nome
- `FAKER.LASTNAME` - Sobrenome
- `FAKER.EMAIL` - Email
- `FAKER.PHONE` - Telefone
- `FAKER.JOB` - Profissão

### 🏢 Empresa

- `FAKER.COMPANY` - Nome da empresa
- `FAKER.PRODUCT` - Nome do produto
- `FAKER.PRICE` - Preço

### 📍 Localização

- `FAKER.ADDRESS` - Endereço
- `FAKER.CITY` - Cidade
- `FAKER.COUNTRY` - País
- `FAKER.ZIPCODE` - CEP

### 🔢 Dados Técnicos

- `FAKER.UUID` - ID único
- `FAKER.NUMBER` - Número inteiro
- `FAKER.FLOAT` - Número decimal
- `FAKER.BOOLEAN` - Verdadeiro/Falso
- `FAKER.DATE` - Data

### 💻 Internet

- `FAKER.URL` - URL
- `FAKER.USERNAME` - Nome de usuário
- `FAKER.PASSWORD` - Senha
- `FAKER.CREDITCARD` - Cartão de crédito

### 📝 Texto

- `FAKER.WORD` - Palavra
- `FAKER.SENTENCE` - Frase
- `FAKER.PARAGRAPH` - Parágrafo
- `FAKER.COLOR` - Cor

### Exemplo de Uso

```json
{
  "_id": "FAKER.UUID",
  "name": "FAKER.NAME",
  "email": "FAKER.EMAIL",
  "phone": "FAKER.PHONE",
  "company": "FAKER.COMPANY",
  "active": "FAKER.BOOLEAN",
  "created_at": "FAKER.DATE"
}
```

Cada cliente substituirá esses placeholders por valores únicos gerados pelo Faker, permitindo testes realistas com dados variados.

## �🎯 Casos de Uso

- Teste de carga em APIs com dados realistas
- Verificação de performance de serviços web
- Simulação de tráfego distribuído com payloads diversos
- Teste de endpoints que requerem dados específicos
- Monitoramento de disponibilidade
- Teste de validação de dados de entrada

## 🔮 Próximos Passos

- [x] Criação da página `/server` com interface de controle
- [x] Criação da página `/client` com interface de execução
- [x] Implementação do servidor (API Routes)
- [x] Sistema de comunicação entre páginas via EventSource + HTTP POST
- [x] Interface do cliente com estados visuais
- [x] Arquitetura híbrida de comunicação (SSE + HTTP)
- [x] Sistema de autenticação para o servidor
- [x] Suporte para métodos GET e POST
- [x] Sistema de placeholders Faker para geração de dados dinâmicos
- [x] Interface de ajuda com placeholders disponíveis
- [ ] Sistema de relatórios e métricas avançadas
- [ ] Headers customizáveis
- [ ] Configurações avançadas de teste (timeouts, retry)
- [ ] Dashboard de histórico de testes
- [ ] Exportação de resultados (CSV/JSON)
- [ ] Suporte a outros métodos HTTP (PUT, DELETE, PATCH)
- [ ] Templates de corpo de requisição salvos

---

**Desenvolvido por**: Danilo Canalle
**Licença**: MIT
