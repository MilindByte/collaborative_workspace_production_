# Real-Time Collaborative Workspace Backend


A backend service for a real-time collaborative workspace, supporting secure authentication, project management, WebSocket-based real-time collaboration, and asynchronous job processing.

## 📚 Table of Contents

- [Design Decisions](#-design-decisions)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Real-Time Collaboration](#-real-time-collaboration)
- [Background Jobs](#-background-jobs)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Scalability Considerations](#-scalability-considerations)

## 🧠 Design Decisions

- **Modularity**: The system uses a modular NestJS architecture, allowing for easier scaling of specific components (e.g., separating workers from the API).
- **Idempotency**: Implemented `idempotencyKey` for background jobs to prevent duplicate processing of the same request, especially critical in distributed systems.
- **Statelessness**: JWT-based authentication ensures the API remains stateless, facilitating horizontal scaling across multiple containers.
- **Prisma & PostgreSQL**: Chose Prisma for its type safety and developer productivity, paired with PostgreSQL for robust relational data integrity and ACID compliance.
- **BullMQ for Resiliency**: Leveraged BullMQ for job processing due to its reliability, support for priority queues, and automatic retries.

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Role-Based Access Control (RBAC) with three roles: Owner, Collaborator, Viewer
- ✅ Token refresh mechanism
- ✅ API rate limiting (10 requests/60 seconds globally)
- ✅ Secure password hashing with bcrypt

### Project & Workspace Management
- ✅ RESTful APIs for workspaces and projects
- ✅ CRUD operations with proper authorization
- ✅ Member management with role assignment
- ✅ Invitation system
- ✅ Comprehensive Swagger/OpenAPI documentation

### Real-Time Collaboration
- ✅ WebSocket gateway using Socket.io
- ✅ Room-based communication (workspace:project)
- ✅ Events: user join/leave, file changes, cursor updates, activity tracking
- ✅ JWT authentication for WebSocket connections
- ✅ Redis Pub/Sub adapter ready for scaling

### Background Job Processing
- ✅ BullMQ integration with Redis
- ✅ Retry logic with exponential backoff
- ✅ Failure handling and job status tracking
- ✅ Idempotent job processing
- ✅ Simulated job types: CODE_EXECUTION, DATA_PROCESSING, FILE_GENERATION

### DevOps & Observability
- ✅ Docker & Docker Compose configuration
- ✅ Health check endpoints (`/health`)
- ✅ Structured logging (Global Interceptor)
- ✅ API Metrics tracking (`/v1/metrics`)
- ✅ Serverless-ready (Singleton NestJS handler for Lambda)
- ✅ Environment-based configuration
- ✅ CORS enabled
- ✅ Input validation with class-validator

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | NestJS (Node.js/TypeScript) |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma |
| **Caching & Queue** | Redis 7 |
| **Real-Time** | Socket.io |
| **Background Jobs** | BullMQ |
| **Authentication** | JWT (Passport) |
| **API Docs** | Swagger/OpenAPI |
| **Validation** | class-validator |
| **Containerization** | Docker & Docker Compose |

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  (Web/Mobile Apps, WebSocket Clients, API Consumers)        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                     API Gateway / Load Balancer             │
│                     (Rate Limiting, CORS)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴───────────────────────────────────────┐
│                     NestJS Application                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Module (JWT Access/Refresh Tokens, RBAC)       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Workspace & Project Modules (CRUD, Members)         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Collaboration Gateway (WebSocket/Socket.io)         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Jobs Module (BullMQ, Async Processing)              │  │
│  └──────────────────────────────────────────────────────┘  │
└────┬─────────────────────────────────────┬─────────────────┘
     │                                     │
┌────┴─────────────────┐      ┌───────────┴──────────────────-┐
│   PostgreSQL         │      │    Redis                      │
│  (User, Workspace,   │      │  - Caching (Global)           │
│   Project, Job data) │      │  - BullMQ Queues              │
│                      │      │  - WebSocket Pub/Sub Adapter  │
└──────────────────────┘      └───────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
   cp .env.example .env
   ```

4. **Start infrastructure services** (PostgreSQL & Redis):
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

7. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The API will be available at `https://cw1-one.vercel.app`

### Quick Start URLs

- **API Documentation (Swagger):** https://cw1-one.vercel.app/v1/api/docs
- **Health Check:** https://cw1-one.vercel.app/v1/health
- **Metrics Endpoint:** https://cw1-one.vercel.app/v1/metrics
- **WebSocket Endpoint:** wss://cw1-one.vercel.app/collaboration

## 📖 API Documentation

### View Interactive API Documentation

> **Note:** Due to Vercel serverless limitations, Swagger UI (`/v1/api/docs`) is not available. Use Swagger Editor instead.

**Quick Start:**
1. Go to [Swagger Editor](https://editor.swagger.io)
2. Click **File** → **Import URL**
3. Enter: `https://cw1-one.vercel.app/v1/api/docs-json`
4. Test endpoints interactively

**Alternative:** Import the OpenAPI spec in Postman or Insomnia
- **OpenAPI JSON:** https://cw1-one.vercel.app/v1/api/docs-json

**Live Endpoints:**
- **Health Check:** https://cw1-one.vercel.app/v1/health
- **Metrics:** https://cw1-one.vercel.app/v1/metrics

Full API testing guide: [API_TESTING.md](./API_TESTING.md)



### Main Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate refresh token

#### Workspaces
-  `POST /workspaces` - Create a workspace (auto-assigns Owner role)
- `GET /workspaces` - Get all workspaces for current user
- `GET /workspaces/:id` - Get workspace details
- `PATCH /workspaces/:id` - Update workspace (Owner only)
- `DELETE /workspaces/:id` - Delete workspace (Owner only)
- `POST /workspaces/:id/members` - Add member (Owner only)
- `DELETE /workspaces/:id/members/:memberId` - Remove member (Owner only)

#### Projects
- `POST /projects` - Create a project in a workspace
- `GET /projects?workspaceId=xxx` - Get projects (filtered by workspace)
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project (Owner only)
- `DELETE /projects/:id` - Delete project (Owner only)
- `POST /projects/:id/members` - Add member (Owner only)
- `DELETE /projects/:id/members/:memberId` - Remove member (Owner only)

#### Background Jobs
- `POST /jobs` - Create a new background job
- `GET /jobs` - Get all jobs for current user
- `GET /jobs/:id/status` - Get job status and result

## 🔌 Real-Time Collaboration

### WebSocket Connection

Connect to `/collaboration` namespace with JWT token:

```javascript
const socket = io('https://cw1-one.vercel.app/collaboration', {
  auth: {
    token: 'YOUR_JWT_ACCESS_TOKEN'
  }
});
```

### Events

**Client → Server:**
- `user:join` - Join a workspace/project room
- `user:leave` - Leave a room
- `file:change` - Broadcast file changes
- `cursor:update` - Broadcast cursor position
- `activity:update` - Broadcast activity status

**Server → Client:**
- `user:joined` - User joined the room
- `user:left` - User left the room
- `file:changed` - File was modified
- `cursor:updated` - Cursor position updated
- `activity:updated` - Activity status updated

### Example Usage

```javascript
// Join a room
socket.emit('user:join', {
  workspaceId: 'workspace-uuid',
  projectId: 'project-uuid',
  userName: 'John Doe'
});

// Listen for file changes
socket.on('file:changed', (data) => {
  console.log(`File ${data.fileName} was ${data.changeType}`, data);
});

// Broadcast cursor position
socket.emit('cursor:update', {
  workspaceId: 'workspace-uuid',
  projectId: 'project-uuid',
  fileName: 'index.ts',
  position: { line: 10, column: 5 }
});
```

## 🔄 Background Jobs

Jobs are processed asynchronously using BullMQ with Redis.

### Supported Job Types

- `CODE_EXECUTION` - Simulated code execution (~3s)
- `DATA_PROCESSING` - Simulated data processing (~2s)
- `FILE_GENERATION` - Simulated file generation (~4s)

### Creating a Job

```bash
curl -X POST https://cw1-one.vercel.app/v1/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CODE_EXECUTION",
    "payload": "{\"code\": \"console.log(\\\"Hello World\\\")\"}"
  }'
```

### Retry Logic

- **Max Attempts:** 3
- **Backoff Strategy:** Exponential (2s initial delay)
- **Failure Handling:** Jobs marked as FAILED after max attempts

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Deployment

### Production (Vercel)

**Live Deployment:** [https://cw1-one.vercel.app](https://cw1-one.vercel.app)

This application is deployed on Vercel with:
- ✅ **PostgreSQL:** Neon (cloud-hosted)
- ✅ **Redis:** Upstash (cloud-hosted)
- ✅ **Serverless Functions:** Vercel Edge Network
- ✅ **Auto-deployment:** Connected to GitHub main branch

#### Quick Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Configure Environment Variables in Vercel Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
   - Add all variables from `.env.example` for Production, Preview, and Development

3. **Deploy:**
   ```bash
   vercel --prod
   ```
   Or wait for automatic deployment from GitHub

#### Environment Variables (Vercel)

Required variables in Vercel Dashboard:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Redis (Optional - app handles gracefully if not set)
REDIS_URL=rediss://default:token@host:6379

# JWT Secrets (CRITICAL - Use strong random strings)
JWT_ACCESS_SECRET=your-super-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Application
NODE_ENV=production
PORT=3000
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

**Complete deployment guide:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

### Docker Compose (Local/Development)

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

### Build for Production (Local Testing)

```bash
# Build the application
npm run build

# Run production build
npm run start:prod
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm run test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] API documentation accessible
- [ ] Health check endpoint responding
- [ ] SSL/TLS certificates active (handled by Vercel)





## 📈 Scalability Considerations

### Horizontal Scaling

1. **Application Layer:**
   - Deploy multiple NestJS instances behind a load balancer
   - Session-less JWT authentication enables stateless scaling

2. **WebSocket Scaling:**
   - Implement Redis Adapter for Socket.io to share events across instances
   - Already configured in `CollaborationModule`

3. **Database:**
   - Use PostgreSQL read replicas for read-heavy operations
   - Connection pooling with Prisma
   - Proper indexing on foreign keys and frequently queried fields

4. **Caching Strategy:**
   - Redis for frequently accessed data (user sessions, workspace metadata)
   - Implement cache-aside pattern for expensive queries

5. **Job Queue:**
   - BullMQ naturally scales with multiple workers
   - Can partition job types to different queues for prioritization

### Performance Optimizations

- ✅ Database indexes on all foreign keys and unique constraints
- ✅ Lazy loading with Prisma select/include
- ✅ Rate limiting to prevent abuse
- ✅ Async/non-blocking I/O throughout
- ✅ Prepared statements via Prisma (SQL injection protection)

### Monitoring & Observability (Recommendations)

- Add APM tool (e.g., New Relic, Datadog, Prometheus)
- Implement structured logging with correlation IDs
- Set up alerts for job failures and health check failures
- Track WebSocket connection metrics

## 🔐 Security

- ✅ JWT with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- ✅ Bcrypt password hashing (salt rounds: 10)
- ✅ Input validation on all endpoints
- ✅ SQL injection protection via Prisma parameterized queries
- ✅ CORS configuration
- ✅ Rate limiting (global throttle guard)
- ✅ Environment-based secrets management


