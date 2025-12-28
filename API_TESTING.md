# API Testing Guide - Swagger Editor

This guide explains how to test the Collaborative Workspace API using Swagger Editor.

> **⚠️ Important:** Due to Vercel serverless limitations, the Swagger UI at `/v1/api/docs` shows a white page. Use **Swagger Editor** instead.

---

## Quick Start - Import from URL

### Method 1: Direct URL Import (Recommended)

1. **Open Swagger Editor:**  
   Go to [https://editor.swagger.io](https://editor.swagger.io)

2. **Import the OpenAPI Specification:**
   - Click **File** → **Import URL**
   - Enter: `https://cw1-one.vercel.app/v1/api/docs-json`
   - Click **OK**

3. **Start Testing:**
   - The API documentation loads automatically
   - Right panel shows all endpoints
   - Click any endpoint to expand details
   - Use "Try it out" to test endpoints live

### Method 2: Download and Import

```bash
# Download the OpenAPI spec
curl https://cw1-one.vercel.app/v1/api/docs-json > openapi.json
```

Then in Swagger Editor:
1. Go to [https://editor.swagger.io](https://editor.swagger.io)
2. Click **File** → **Import file**
3. Select `openapi.json`

---

## Authentication Flow

### Step 1: Register a User

1. In Swagger Editor, find the **Authentication** section
2. Expand `POST /v1/auth/register`
3. Click **Try it out**
4. Enter the request body:

```json
{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User"
}
```

5. Click **Execute**
6. **Copy the `accessToken`** from the response

### Step 2: Authorize

1. Click the **Authorize** button (🔓 lock icon) at the top
2. In the "Value" field, enter: `Bearer <YOUR_ACCESS_TOKEN>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...`
3. Click **Authorize**
4. Click **Close**

Now all protected endpoints will use your token automatically!

### Step 3: Test Protected Endpoints

#### Create a Workspace

1. Find `POST /v1/workspaces`
2. Click **Try it out**
3. Enter:

```json
{
  "name": "My Workspace",
  "description": "Test workspace for API testing"
}
```

4. Click **Execute**
5. **Copy the workspace `id`** from response

#### Create a Project

1. Find `POST /v1/projects`
2. Click **Try it out**
3. Enter (use workspace ID from previous step):

```json
{
  "name": "My Project",
  "description": "Test project",
  "workspaceId": "YOUR_WORKSPACE_ID"
}
```

4. Click **Execute**

#### Create a Background Job

1. Find `POST /v1/jobs`
2. Click **Try it out**
3. Enter:

```json
{
  "type": "CODE_EXECUTION",
  "payload": "{\"code\": \"console.log('Hello World')\"}"
}
```

4. Click **Execute**
5. Copy the job `id`

#### Check Job Status

1. Find `GET /v1/jobs/{id}/status`
2. Click **Try it out**
3. Paste the job ID
4. Click **Execute**

---

## API Endpoints Overview

### 🔐 Authentication (4 endpoints)
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login with email/password
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout user

### 🏢 Workspaces (7 endpoints)
- `POST /v1/workspaces` - Create workspace
- `GET /v1/workspaces` - List all workspaces
- `GET /v1/workspaces/{id}` - Get workspace details
- `PATCH /v1/workspaces/{id}` - Update workspace (Owner only)
- `DELETE /v1/workspaces/{id}` - Delete workspace (Owner only)
- `POST /v1/workspaces/{id}/members` - Add member (Owner only)
- `DELETE /v1/workspaces/{id}/members/{memberId}` - Remove member (Owner only)

### 📁 Projects (7 endpoints)
- `POST /v1/projects` - Create project
- `GET /v1/projects` - List projects
- `GET /v1/projects/{id}` - Get project details
- `PATCH /v1/projects/{id}` - Update project
- `DELETE /v1/projects/{id}` - Delete project
- `POST /v1/projects/{id}/members` - Add member
- `DELETE /v1/projects/{id}/members/{memberId}` - Remove member

### ⚙️ Background Jobs (3 endpoints)
- `POST /v1/jobs` - Create background job
- `GET /v1/jobs` - List jobs
- `GET /v1/jobs/{id}/status` - Get job status

### 🏥 Health & Metrics (2 endpoints)
- `GET /v1/health` - Health check
- `GET /v1/metrics` - Application metrics

---

## Testing with cURL

### Register
```bash
curl -X POST https://cw1-one.vercel.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST https://cw1-one.vercel.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Create Workspace (with token)
```bash
curl -X POST https://cw1-one.vercel.app/v1/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workspace",
    "description": "Test workspace"
  }'
```

---

## Alternative Testing Tools

### Postman
1. Import from URL: `https://cw1-one.vercel.app/v1/api/docs-json`
2. In Postman: **Import** → **Link** → Paste URL
3. Collection created automatically

### Insomnia
1. Download OpenAPI spec: `curl https://cw1-one.vercel.app/v1/api/docs-json > openapi.json`
2. In Insomnia: **Import/Export** → **Import Data** → Select file

---

## Troubleshooting

### "Unauthorized" Error (401)
- Make sure you've clicked **Authorize** and entered your token
- Token format should be: `Bearer eyJhbGciOiJ...`
- Access tokens expire after 15 minutes - get a new one via login

### "Not Found" Error (404)
- Check that you're using the correct endpoint path
- All endpoints start with `/v1/`
- Example: `/v1/workspaces` not `/workspaces`

### "Forbidden" Error (403)
- You don't have permission for this resource
- Check if the resource belongs to your workspace/project
- Ensure you have the right role (Owner/Collaborator)

---

## Resources

- **Swagger Editor:** https://editor.swagger.io
- **OpenAPI Spec URL:** https://cw1-one.vercel.app/v1/api/docs-json
- **Health Check:** https://cw1-one.vercel.app/v1/health
- **Metrics:** https://cw1-one.vercel.app/v1/metrics
