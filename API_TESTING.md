# API Testing Guide (Swagger UI)

This guide explains how to test the Collaborative Workspace API using the built-in Swagger UI.

**URL**: [http://localhost:3000/v1/api/docs](http://localhost:3000/v1/api/docs)

---

## 1. Getting Started

1.  Open your browser and navigate to the **URL** above.
2.  You will see a list of API resources: `Authentication`, `Workspaces`, `Projects`, `Jobs`.

---

## 2. Authentication Flow

Most endpoints are protected. Follow these steps to authenticate.

### Step A: Register a User
1.  Expand **Authentication** > `POST /auth/register`.
2.  Click the **Try it out** button.
3.  Enter a valid JSON payload in the request body:
    ```json
    {
      "email": "tester@example.com",
      "password": "Password123!",
      "name": "API Tester"
    }
    ```
4.  Click the big blue **Execute** button.
5.  Scroll down to **Responses**. You should see Code `201`.
6.  **Copy the `accessToken`** from the Response body JSON.

### Step B: Authorize the Session
1.  Scroll to the very top of the Swagger page.
2.  Click the **Authorize** button (green open padlock icon on the right).
3.  In the "Value" box, type: `Bearer <YOUR_COPIED_TOKEN>`
    *   *Example*: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...`
4.  Click **Authorize**, then **Close**.
5.  The padlock icons next to endpoints should now be **locked (closed)**.

---

## 3. Testing Resources

Now that you are logged in, you can test other endpoints.

### Create a Workspace
1.  Expand **Workspaces** > `POST /workspaces`.
2.  Click **Try it out**.
3.  Enter payload:
    ```json
    {
      "name": "Engineering Team",
      "description": "Main workspace"
    }
    ```
4.  Click **Execute**.
5.  Check the response for the new `id`. User is automatically made `OWNER`.

### Create a Project
1.  Expand **Projects** > `POST /projects`.
2.  Click **Try it out**.
3.  Enter payload (use the workspace `id` from the previous step):
    ```json
    {
      "name": "Backend API",
      "description": "NestJS Application",
      "workspaceId": "PASTE_WORKSPACE_ID_HERE"
    }
    ```
4.  Click **Execute**.

### Create a Background Job
1.  Expand **Jobs** > `POST /jobs`.
2.  Click **Try it out**.
3.  Enter payload (Simulate a code execution job):
    ```json
    {
      "type": "CODE_EXECUTION",
      "payload": "{\"code\": \"console.log('Hello World')\"}"
    }
    ```
4.  Click **Execute**.
5.  You will receive a Job ID and status `PENDING`.

### Check Job Status
1.  Expand **Jobs** > `GET /jobs/{id}/status`.
2.  Click **Try it out**.
3.  Paste the Job ID from the previous step.
4.  Click **Execute**.
5.  You should see the result once the background worker processes it.

---

## 4. Notes

- **Real-Time Collaboration**: Swagger UI **cannot** test WebSocket connections (`ws://`). You will need a client like Postman (WebSocket support) or a custom frontend script.
- **Errors**: If you get `401 Unauthorized`, your token may have expired or you forgot Step B (Authorize).
