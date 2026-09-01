# Deploying Personal Gemini Journal to Vercel

This repository is pre-configured for one-click deployment on **Vercel** with full-stack support for the Vite + React frontend and the Express / Gemini serverless backend.

---

## 🚀 Quick Deployment Steps

### 1. Import Repository into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Connect your GitHub/GitLab account and import this repository.
3. Select **Vite** or **Other** as the Framework Preset (Vercel will automatically read `vercel.json`).

### 2. Configure Build & Output Settings
Vercel will automatically use the settings from `vercel.json`:
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables
In Vercel **Project Settings > Environment Variables**, add the following:

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Your Google Gemini API Key from Google AI Studio. |
| `VITE_FIREBASE_API_KEY` | *Optional* | If overriding `firebase-applet-config.json`. |
| `VITE_FIREBASE_AUTH_DOMAIN` | *Optional* | Firebase Auth Domain. |
| `VITE_FIREBASE_PROJECT_ID` | *Optional* | Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET`| *Optional* | Firebase Storage Bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | *Optional* | Firebase Messaging Sender ID. |
| `VITE_FIREBASE_APP_ID` | *Optional* | Firebase App ID. |

### 4. Deploy!
Click **Deploy**. Vercel will:
1. Build and optimize the React frontend into `dist/`.
2. Deploy `/api/index.ts` as a Serverless Function routing `/api/*` to your Express Gemini handlers.
3. Serve the SPA with seamless client-side routing.

---

## 🔒 Firebase Authentication Note
Remember to add your Vercel deployment domain (e.g., `your-app.vercel.app`) to your **Firebase Console > Authentication > Settings > Authorized domains** list to allow Google Sign-In popups to authenticate successfully.
