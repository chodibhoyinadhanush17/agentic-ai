# Agentflow_AI: Agentic AI Operations Automation Platform

**Agentflow_AI** is a full-stack, enterprise-grade AI Operations Automation Platform that translates natural language descriptions into executable visual workflows, renders them on an interactive drag-and-drop canvas, and executes them through a deterministic 5-stage chain of cooperating AI agents.

---

## 🌟 Key Highlights & Architectural Features

- **Natural Language Prompt to Visual Graph**: Generate end-to-end DAG workflows from plain English using OpenRouter (Claude 3.5 Sonnet), Google Gemini 2.0 Flash, or deterministic rule builder.
- **5-Stage Cooperating AI Agent Chain**:
  1. **Planner Agent**: Performs topological DAG sorting, cycle detection, and computes pre-execution confidence scores.
  2. **Execution Agent**: Dispatches actions to third-party tools or AI inference models with template variable interpolation (`{{node_name.property}}`).
  3. **Validation Agent**: Verifies output schema contracts and guarantees payload integrity.
  4. **Recovery Agent**: Classifies errors across a 5-tier taxonomy (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and executes automated retry with exponential backoff or escalation.
  5. **Monitoring Agent**: Streams live event timelines to the browser via Socket.IO and writes persistent audit logs.
- **Third-Party Integrations Layer**: Gmail, Slack, Discord, and Google Sheets over OAuth with **AES-256 encrypted credentials at rest**.
- **Real-Time WebSocket Layer**: Live agent execution streaming, status updates, and notifications drawer.
- **Queueing & Scheduling**: BullMQ on Redis with high-throughput in-memory async queue fallback.
- **Zero-Config Local Development**: Automatically falls back to high-performance in-memory database and queues when external MongoDB or Redis instances are not running.

---

## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (`@xyflow/react`), Socket.IO client, Lucide Icons |
| **Backend** | Node.js, Express.js, MongoDB / Mongoose, JWT, BullMQ, ioredis, Socket.IO, Helmet, Morgan, Compression, Express-Validator, Bcrypt.js (Cost 12) |
| **AI Integration** | OpenRouter API, Google Generative AI (`@google/generative-ai`), LangGraph substrate detection |
| **Security** | AES-256 Credential Encryption, Rate Limiting, CORS, HTTP Security Headers |

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (v20+ / v24 LTS recommended)
- **npm**: v9.0.0 or higher
- *(Optional)* **MongoDB**: v6.0+ (the system automatically uses an in-memory database fallback if not running)
- *(Optional)* **Redis**: v6.0+ (the system automatically uses an in-memory priority queue if not running)

---

## ⚙️ Quick Start & Local Setup

### Step 1: Install Dependencies

From the project root directory, install the root, backend, and frontend dependencies:

```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

*Or run the all-in-one helper script:*
```bash
npm run install:all
```

---

### Step 2: Configure Environment Variables

Create `.env` in the `server/` directory or root directory. You can copy from `.env.example`:

```bash
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item .env.example server/.env
```

#### Key Environment Variables:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Security & Auth
JWT_SECRET=super_secret_jwt_key_min_32_characters_long_agentflow_ai_2026
JWT_EXPIRES_IN=7d
CREDENTIAL_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Database & Queue (Optional - has automated zero-config fallback)
MONGODB_URI=mongodb://127.0.0.1:27017/agentflow_ai
REDIS_URL=redis://127.0.0.1:6379

# AI Keys (Optional - has deterministic rule engine fallback)
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# OAuth Provider Credentials (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/google/callback

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/slack/callback

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/discord/callback
```

---

### Step 3: Run the Application Locally

Start both the backend server and frontend client concurrently with a single command from the root directory:

```bash
npm run dev
```

Or start them in separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 3000)
npm run dev:client
```

---

### Step 4: Access the Platform

Open your web browser and navigate to:

- **Frontend Console**: [http://localhost:3000](http://localhost:3000)
- **Backend API Heartbeat**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

#### 🔑 Demo Credentials (Zero Setup):
- **Email**: `operator@agentflow.ai`
- **Password**: `password123`
- *(Or register any new account instantly on the `/register` page)*

---

## 🧪 Running Automated Tests

To run the verification test suite covering authentication, AES-256 encryption, AI graph generation, and the 5-agent execution pipeline:

```bash
npm run test
```

---

## 📁 Repository Directory Structure

```
.
├── package.json                   # Root package & concurrent dev scripts
├── README.md                      # Complete documentation & local run guide
├── .env.example                   # Environment configuration template
│
├── server/                        # Express Backend & Agent Orchestrator
│   ├── package.json
│   ├── src/
│   │   ├── app.js                 # Express app & middleware setup
│   │   ├── server.js              # Server entry point & Socket.IO init
│   │   ├── config/
│   │   │   ├── env.js             # Centralized environment variables
│   │   │   ├── db.js              # MongoDB connection & in-memory fallback
│   │   │   └── socket.js          # Socket.IO rooms & event emitters
│   │   ├── agents/
│   │   │   ├── orchestrator.js    # Multi-agent coordinator (pause/resume/cancel)
│   │   │   ├── plannerAgent.js    # DAG topological sorter & confidence scorer
│   │   │   ├── executionAgent.js  # Node execution & template variable resolver
│   │   │   ├── validationAgent.js # Schema contract validator
│   │   │   ├── recoveryAgent.js   # 5-tier error classifier & backoff engine
│   │   │   └── monitoringAgent.js # Live WebSocket streamer & log writer
│   │   ├── integrations/
│   │   │   ├── baseIntegration.js # Abstract integration interface
│   │   │   ├── gmailIntegration.js
│   │   │   ├── slackIntegration.js
│   │   │   ├── discordIntegration.js
│   │   │   └── googleSheetsIntegration.js
│   │   ├── models/
│   │   │   ├── User.js            # User model with bcrypt (cost 12)
│   │   │   ├── Workflow.js        # Workflow schema & nodes/edges
│   │   │   ├── Execution.js       # Run snapshot & execution states
│   │   │   ├── ExecutionLog.js    # Agent timeline events
│   │   │   ├── Integration.js     # OAuth tokens with AES-256 encryption
│   │   │   ├── Notification.js    # User alert notifications
│   │   │   └── AgentMemory.js     # Cross-step agent context memory
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── workflowService.js
│   │   │   ├── executionService.js
│   │   │   ├── aiService.js       # OpenRouter -> Gemini -> Rule Builder
│   │   │   └── integrationService.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── workflowController.js
│   │   │   ├── executionController.js
│   │   │   └── integrationController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── workflowRoutes.js
│   │   │   ├── executionRoutes.js
│   │   │   ├── integrationRoutes.js
│   │   │   └── notificationRoutes.js
│   │   └── queues/
│   │       └── executionQueue.js  # BullMQ + in-memory worker fallback
│   └── tests/
│       └── orchestration.test.js  # End-to-end multi-agent test suite
│
└── client/                        # Next.js Pages Router Frontend
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── styles/
        │   └── globals.css        # Operator console dark theme & React Flow
        ├── components/
        │   ├── AppShell/          # Operator header, sidebar, notifications drawer
        │   ├── MetricGrid/        # KPI cards & health indicators
        │   ├── WorkflowCanvas/    # React Flow canvas & custom node types
        │   ├── NodePalette/       # Drag-and-drop categorized nodes
        │   ├── NodeConfigPanel/   # Properties inspector side panel
        │   └── ProtectedRoute/    # Route guard & role verification
        ├── pages/
        │   ├── _app.js
        │   ├── index.js           # Platform landing page & multi-agent showcase
        │   ├── login.js           # Operator login
        │   ├── register.js        # Operator registration
        │   ├── dashboard.js       # Operations dashboard
        │   ├── integrations.js    # OAuth connection management
        │   ├── settings.js        # Operator profile & system diagnostics
        │   ├── workflows/
        │   │   ├── index.js       # Workflow list, filter, duplicate, delete
        │   │   ├── builder.js     # Natural language prompt-to-graph studio
        │   │   └── [id].js        # Visual canvas editor
        │   └── executions/
        │       ├── index.js       # Executions audit list
        │       └── [id].js        # Real-time multi-agent live timeline
        ├── store/
        │   ├── authStore.js       # Zustand auth store with localStorage
        │   └── workflowStore.js   # Zustand workflow & live execution state
        └── services/
            ├── api.js             # Axios client with JWT interceptor
            └── socket.js          # Socket.IO client singleton & room manager
```

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` - Register a new operator account (bcrypt cost 12).
- `POST /api/auth/login` - Authenticate user & issue signed JWT.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Workflows
- `GET /api/workflows/dashboard` - Get aggregated KPIs & recent runs.
- `GET /api/workflows` - List user workflows with pagination & search.
- `POST /api/workflows` - Create a blank workflow.
- `POST /api/workflows/generate` - Generate DAG graph from prompt.
- `GET /api/workflows/:id` - Fetch single workflow details.
- `PUT /api/workflows/:id` - Update workflow nodes/edges & bump version.
- `POST /api/workflows/:id/duplicate` - Clone workflow.
- `POST /api/workflows/:id/execute` - Trigger execution run.
- `DELETE /api/workflows/:id` - Delete workflow.

### Executions
- `GET /api/executions` - List all runs with status filters.
- `GET /api/executions/:id` - Fetch run snapshot & outputs.
- `GET /api/executions/:id/timeline` - Fetch detailed 5-agent timeline logs.
- `POST /api/executions/:id/pause` - Pause an active execution.
- `POST /api/executions/:id/resume` - Resume a paused execution.
- `POST /api/executions/:id/cancel` - Cancel a running execution.

### Integrations & Notifications
- `GET /api/integrations` - List status of Gmail, Slack, Discord, Google Sheets.
- `GET /api/integrations/oauth/:provider/start` - Initiate OAuth redirect.
- `GET /api/integrations/oauth/:provider/callback` - Handle OAuth code exchange.
- `POST /api/integrations` - Manually save API keys/webhooks.
- `POST /api/integrations/:provider/disconnect` - Disconnect provider.
- `GET /api/notifications` - Fetch user alerts.
- `POST /api/notifications/mark-read` - Mark notifications as read.

---

## 🛡️ Security Best Practices Implemented

1. **Password Hashing**: Passwords hashed using `bcrypt` at cost factor 12.
2. **Token Encryption**: OAuth access tokens and refresh tokens are encrypted at rest with AES-256 (`CREDENTIAL_ENCRYPTION_KEY`).
3. **Decrypted Tokens Protection**: Decrypted secrets are never logged or returned over API endpoints.
4. **Error Classification**: Expired/missing credentials throw explicit domain errors (`AUTH_EXPIRED`, `INTEGRATION_NOT_CONNECTED`).
5. **Rate Limiting**: Auth endpoints protected via `express-rate-limit`.
6. **HTTP Headers**: Security headers enforced via `helmet`.
