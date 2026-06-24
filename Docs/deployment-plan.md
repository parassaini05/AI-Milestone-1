# Deployment Plan: Railway (Backend) & Vercel (Frontend)

This document outlines the deployment strategy for the AI-Powered Restaurant Recommendation System. The application is divided into two distinct environments to optimize hosting costs and performance:

- **Backend API**: Hosted on [Railway](https://railway.app/).
- **Frontend UI**: Hosted on [Vercel](https://vercel.com/).

---

## 1. Architecture Overview

1. The user accesses the static web application served globally via Vercel's Edge Network.
2. The Vercel frontend makes API calls to `/api/...`.
3. Vercel acts as a proxy (configured via `vercel.json`), forwarding these `/api/` requests to the Node.js Express server running on Railway.
4. The Railway backend interacts with the local SQLite database (persisted via a Volume) and the external Groq API.

---

## 2. Backend Deployment (Railway)

Railway is ideal for our Node.js backend because it supports persistent storage out-of-the-box, which is strictly required for our SQLite database (`data/zomato.db`).

### Step-by-Step Instructions:

1. **Sign in to Railway**: Go to [Railway.app](https://railway.app/) and log in with your GitHub account.
2. **Create a New Project**:
   - Click **New Project** -> **Deploy from GitHub repo**.
   - Select this repository.
   - Railway will automatically detect the Node.js environment from `package.json` and prepare the build.
3. **Configure Environment Variables**:
   - Navigate to the **Variables** tab in your Railway project.
   - Add your Groq API key: `GROQ_API_KEY=your_secret_key_here`.
   - *Note: Railway automatically assigns the `PORT` variable, so you do not need to set it manually.*
4. **Set Up a Persistent Volume (CRITICAL)**:
   - Because SQLite writes data locally, any restart will wipe the database without a volume.
   - Go to the **Settings** tab -> **Volumes**.
   - Click **Add Volume**.
   - Set the **Mount Path** to `/app/data` (this ensures everything inside the `data/` folder is preserved across deployments).
5. **Deploy and Get the URL**:
   - Railway will automatically build and deploy the app.
   - Once deployed, go to the **Settings** tab -> **Networking** and generate a public domain (e.g., `https://your-app-production.up.railway.app`).
   - **Save this URL!** You will need it for the frontend configuration.

---

## 3. Frontend Deployment (Vercel)

Vercel will serve our static files (`public/` directory) and handle the routing of our API requests to the Railway backend.

### Step-by-Step Instructions:

1. **Update the `vercel.json` File**:
   - Before deploying, you need to tell Vercel where to proxy API requests.
   - Open `vercel.json` in the root of your project.
   - Replace `<your-railway-app-url>` with the public domain you got from Railway in step 2.5.
   ```json
   {
     "version": 2,
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-app-production.up.railway.app/api/$1"
       }
     ]
   }
   ```
2. **Sign in to Vercel**: Go to [Vercel.com](https://vercel.com/) and log in.
3. **Add New Project**:
   - Click **Add New** -> **Project**.
   - Import this GitHub repository.
4. **Configure the Deployment**:
   - **Framework Preset**: Vercel will likely detect this as `Other` (which is correct for Vanilla JS/HTML).
   - **Root Directory**: Leave it as `./` (the root).
   - **Build Command**: Leave blank.
   - **Output Directory**: Vercel will automatically serve the root or `public` directory based on your requests.
5. **Deploy**:
   - Click **Deploy**. Vercel will provision an SSL certificate and give you a live frontend URL (e.g., `https://your-project.vercel.app`).

---

## 4. Post-Deployment Checklist

- [ ] **Test API Connectivity**: Open your Vercel frontend URL, submit a restaurant query, and ensure the loading state transitions into displaying actual data.
- [ ] **Check Railway Logs**: If the frontend shows an error, check the **Deployments -> View Logs** section in Railway to see if the Express server is crashing or if the Groq API key is invalid.
- [ ] **Verify SQLite Persistence**: Restart the Railway instance manually (or redeploy) and test if the data persists without needing to re-run the `ingester.js` script.
- [ ] **Security**: Ensure that your `vercel.json` is committed, but your `.env` file (containing the Groq API key) is in `.gitignore` and only manually entered into the Railway dashboard.
