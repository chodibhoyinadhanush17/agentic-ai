# 🚀 Agentflow_AI Full Production Deployment Guide

This guide covers complete step-by-step instructions to push your repository to **GitHub**, deploy the **Backend Web Engine** to **Render**, and deploy the **Frontend Next.js Console** to **Vercel**.

---

## 📋 Table of Contents
1. [Git Setup & Push](#1-git-setup--push)
2. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
3. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
4. [Step 4: Connect Frontend & Backend (Final Sync)](#step-4-connect-frontend--backend-final-sync)
5. [Step 5: Post-Deployment Smoke Test](#step-5-post-deployment-smoke-test)

---

## 1. Git Setup & Push

Your remote is set to: **`https://github.com/chodibhoyinadhanush17/agentic-ai.git`**

---

## Step 2: Deploy Backend to Render

1. Log in to **[Render.com](https://render.com)** (or sign in with GitHub).
2. Click the blue **New +** button at top right $\rightarrow$ Select **Web Service**.
3. Select **Build and deploy from a Git repository** $\rightarrow$ Connect your **`chodibhoyinadhanush17/agentic-ai`** repository.
4. Fill in these settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `agentflow-backend` |
| **Region** | Oregon (US West) or Ohio (US East) |
| **Branch** | `main` |
| **Root Directory** | `server` *(Important: type "server")* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/server.js` |
| **Instance Type** | `Free` |

5. Scroll down to **Environment Variables** $\rightarrow$ Click **Add Environment Variable** for each:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://chodibhoyinadhanush129168_db_user:WBB7fRkecMNUVRLw@myvipcluster17.bprm3s1.mongodb.net/agentflow_ai?retryWrites=true&w=majority&appName=myvipcluster17` |
| `JWT_SECRET` | `super_secret_jwt_key_min_32_characters_long_agentflow_ai_2026` |
| `JWT_EXPIRES_IN` | `7d` |
| `CREDENTIAL_ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `GEMINI_API_KEY` | `your_gemini_api_key` |
| `GEMINI_MODEL` | `gemini-2.0-flash` |

6. Click **Create Web Service** at the bottom.
7. Render will build and deploy your backend. Once done, copy your Render URL at the top:
   - Example: `https://agentflow-backend-xxxx.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Log in to **[Vercel.com](https://vercel.com)** (sign in with GitHub).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your **`chodibhoyinadhanush17/agentic-ai`** repository.
4. In the **Configure Project** screen:
   - Leave **Root Directory** as `./` (automatically configured via `vercel.json`).
5. Expand **Environment Variables** and add these 2 variables:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://<YOUR-RENDER-URL>.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://<YOUR-RENDER-URL>.onrender.com` |

*(Paste your live Render URL from Step 2, e.g. `https://agentflow-backend-xxxx.onrender.com`)*

6. Click **Deploy**.
7. In ~60 seconds, Vercel will give you your live URL:
   - Example: `https://agentic-ai.vercel.app`

---

## Step 4: Connect Frontend & Backend (Final Sync)

1. Copy your live Vercel URL: `https://agentic-ai.vercel.app`.
2. Go back to your [Render Dashboard](https://dashboard.render.com).
3. Select your `agentflow-backend` service $\rightarrow$ Click **Environment**.
4. Add or update `CLIENT_URL`:
   - **Key**: `CLIENT_URL`
   - **Value**: `https://agentic-ai.vercel.app`
5. Click **Save Changes**.

---

## Step 5: Post-Deployment Smoke Test

1. Open your live Vercel site in your browser.
2. Test signing in on `/login` (`operator@agentflow.ai` / `password123`) or register a new account on `/register`.
3. Open `/workflows/builder` $\rightarrow$ Click **🎲 Surprise Me** $\rightarrow$ Click **Execute Workflow Now** and verify status becomes **COMPLETED (SUCCESS)**.

---

🎉 **Your Agentflow_AI application is now 100% live in production on the cloud!**
