# Swarm - Sistema de Teste de Carga Distribuído

O Swarm é um sistema de teste de carga distribuído que permite coordenar múltiplos clientes para realizar requisições simultâneas contra uma URL alvo. O sistema é composto por duas partes principais: um servidor de controle e clientes que executam as requisições.

## 🏗️ Arquitetura

O projeto é uma aplicação Next.js única com duas páginas principais:

### `/server` - Página do Servidor de Controle

- Interface web para controle e monitoramento
- Gerenciamento de conexões WebSocket com clientes
- Configuração de parâmetros de teste
- Visualização em tempo real do status dos clientes

### `/client` - Página do Cliente de Execução

- Interface que se conecta ao servidor via WebSocket
- Executa requisições HTTP conforme comandos do servidor
- Relatório de status (sucesso/erro) de volta ao servidor

## ✨ Funcionalidades

### Servidor

- 📊 **Monitoramento de Clientes**: Exibe quantidade de clientes conectados
- 🐝 **Configuração de "Abelhas"**: Define quantas requisições cada cliente deve fazer
- 🎯 **URL Alvo**: Configuração da URL que será testada
- ▶️ **Controle de Execução**: Botão para iniciar o teste de carga
- 📈 **Feedback em Tempo Real**: Box individual para cada cliente mostrando o status

### Cliente

- 🔌 **Conexão WebSocket**: Aguarda e mantém conexão com o servidor
- 🎨 **Interface Dinâmica**: Layout muda após estabelecer conexão
- 📦 **Visualização de Tarefas**: Boxes representando cada requisição a ser feita
- ⏳ **Estados Visuais**: Loading, sucesso e erro para cada requisição
- 📡 **Comunicação Bidirecional**: Envia feedback para o servidor

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
- **Comunicação**: WebSockets
- **Styling**: CSS Modules / Tailwind CSS
- **Build**: Next.js Build System

## 📋 Fluxo de Funcionamento

1. **Inicialização**: Aplicação Next.js é iniciada
2. **Acesso às Páginas**: Usuários acessam `/server` e `/client` em navegadores diferentes
3. **Conexão**: Clientes se conectam ao servidor via WebSocket
4. **Configuração**: Operador define parâmetros na página do servidor:
   - Número de "abelhas" (requisições) por cliente
   - URL alvo para teste
5. **Distribuição**: Servidor envia configuração para todos os clientes conectados
6. **Execução**: Servidor dispara comando de início
7. **Monitoramento**: Interface mostra progresso em tempo real
8. **Relatório**: Resultados consolidados são exibidos

## 🎯 Casos de Uso

- Teste de carga em APIs
- Verificação de performance de serviços web
- Simulação de tráfego distribuído
- Monitoramento de disponibilidade

## 🔮 Próximos Passos

- [x] Criação da página `/server` com interface de controle
- [x] Criação da página `/client` com interface de execução
- [x] Implementação do servidor (API Routes)
- [x] Sistema de comunicação entre páginas via WebSocket
- [x] Interface do cliente com estados visuais
- [ ] Sistema de relatórios e métricas
- [ ] Configurações avançadas de teste

---

**Desenvolvido por**: Danilo Canalle
**Licença**: MIT
