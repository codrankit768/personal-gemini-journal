🧠 Personal Gemini Journal

A private, secure, AI-powered space for journaling, reflection, and personal growth.

<p align="center"> <strong>🔐 Firebase Auth</strong> • <strong>🤖 Gemini AI</strong> • <strong>💾 Firestore</strong> • <strong>🛡️ Security First</strong> </p>
✨ Overview

Personal Gemini Journal is a secure AI-powered journaling application built with Google's Gemini ecosystem.

Users can write private reflections, have meaningful multi-turn conversations with Gemini, track their moods, and receive AI-generated insights—all while keeping their journal data isolated to their authenticated account.

The project was designed with a security-first, production-oriented architecture from the beginning.

🌟 Features
Feature	Description
🔐 Google Sign-In	Secure authentication with Firebase Authentication
✍️ Private Journaling	Create and save personal reflections
🤖 Gemini Companion	Multi-turn AI conversations about your thoughts
🧠 AI Insights	Summaries, themes, questions, and practical next steps
😊 Mood Tracking	Track seven core mood dimensions
📊 Mood History	Visualize your personal emotional patterns
📅 Weekly Reflection	Gemini-generated weekly synthesis
🔒 User Isolation	Firestore authorization prevents cross-user access
♻️ Reliable Persistence	Saved journal data survives refreshes and re-login
🛡️ Security Model	Server-side secrets and authorization boundaries
🎨 Mood Dimensions

The application supports seven optional mood states:

😊 Happy
🌿 Calm
⚖️ Neutral
🌧️ Sad
🔥 Frustrated
⚡ Anxious
✨ Motivated
🤖 AI-Powered Reflection

After saving a journal entry, Gemini can generate:

📝 Summary

A concise summary capturing the essence of the entry.

🏷️ Key Themes

Important themes and patterns identified from the user's reflection.

❓ Reflection Questions

Thought-provoking questions designed to encourage deeper reflection.

🚀 Practical Next Steps

Small, actionable suggestions based on the user's goals and reflection.

The application does not provide medical or mental-health diagnoses.

💬 Multi-Turn Reflection Companion

The Reflection Companion maintains conversation context during an active session.

Example:

User:
Help me reflect deeper on what I wrote.

Gemini:
What specifically about this project excites you?

User:
I'm excited about learning AI.

Gemini:
How could you turn that excitement into a small goal for tomorrow?


This creates a conversational reflection experience rather than a single one-shot AI response.

🏗️ Architecture
                 ┌──────────────────────┐
                 │       User           │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Web Application     │
                 │      Frontend         │
                 └──────────┬───────────┘
                            │
                  Firebase Authentication
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Authenticated UID   │
                 └──────────┬───────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌──────────────────┐        ┌──────────────────┐
   │  Cloud Firestore │        │   Gemini API     │
   │                  │        │                  │
   │ User-isolated    │        │ AI Reflection    │
   │ journal data     │        │ & Summaries      │
   └──────────────────┘        └──────────────────┘

🔐 Security

Security was treated as a core architectural requirement rather than an afterthought.

Authentication

Firebase Authentication with Google Sign-In protects private application functionality.

Firestore Isolation

Journal data is scoped to the authenticated user's UID.

Conceptually:

/users/{userId}/interactions/{interactionId}


Firestore authorization verifies that the requesting user owns the requested data.

No Insecure Rules

The application does not use insecure rules such as:

allow read, write: if true;

Secret Protection

API keys and credentials must never be committed to GitHub.

Production deployments should use:

Google Cloud Secret Manager
Secure environment-variable injection
Server-side API access

Never expose a Gemini API key in browser-side JavaScript.

🧠 Threat Model

The project considers five major security zones:

Threat Zone	Example Risk	Mitigation
📥 Input Surfaces	Malicious journal input	Validation and sanitization
🧠 AI Reasoning	Prompt injection	Treat external/user data as untrusted
🔧 Tool Execution	Unauthorized API actions	Authorization at every boundary
💾 Memory & State	Cross-user data leakage	UID-based Firestore isolation
🌐 External Communication	Credential leakage	Server-side secrets and controlled APIs
🧪 Testing

The application has been tested for:

✅ Google Sign-In
✅ Sign-out
✅ Journal creation
✅ Firestore persistence
✅ Journal history
✅ Mood selection
✅ Gemini AI Insights
✅ Multi-turn Gemini conversation
✅ Weekly AI Reflection
✅ Re-login persistence
✅ Cross-user data isolation
✅ Error handling
✅ Responsive interface
Cross-User Security Test

Two authenticated users were tested independently.

User A
├── Entry A1 ✅
├── Entry A2 ✅
└── User B entries ❌

User B
├── Entry B1 ✅
└── User A entries ❌


This confirms that journal data is isolated by authenticated user identity.

🚀 Local Development
Prerequisites
Node.js
npm
Firebase project
Google AI/Gemini access
Git
Install
npm install

Configure environment

Use environment variables or an approved secret-management mechanism.

Never commit real secrets to GitHub.

Start development server
npm run dev

Production build
npm run build

Type checking
npx tsc --noEmit

☁️ Cloud Run Deployment

Cloud Run is the intended production deployment target for the challenge.

Before deployment:

Create/select a Google Cloud project.
Configure billing.
Enable required Google Cloud services.
Configure Secret Manager.
Configure Firestore.
Deploy the application to Cloud Run.
Apply the challenge verification label.

Example verification label:

gcloud run services update <SERVICE_NAME> \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=<REGION>

Current Deployment Status

🟡 Cloud Run deployment pending

The application has been built and functionally tested in Google AI Studio. Cloud Run deployment is currently pending because Google Cloud billing has not been configured.

🐙 GitHub

This repository contains:

Application source code
Security architecture
Firestore authorization configuration
Testing information
Deployment documentation
Challenge implementation details

Never commit secrets or credentials.

🏆 Challenge

Built as part of the Develop Gen AI Apps with Gemini and Streamlit / Secure Personal Gemini Journal challenge.

Core Challenge Requirements
🔐 User Authentication
🤖 Multi-turn Gemini Interaction
💾 Isolated Firestore Storage
🔑 Secure Key Management
🛡️ Production-oriented Security
✨ Original Feature Enhancement
Original Enhancement

Mood & Reflection Insights

The application goes beyond basic journaling by combining mood tracking with Gemini-generated:

summaries
themes
reflection questions
practical next steps
weekly reflection synthesis
📌 Project Status

Functional prototype: 🟢 Complete

Security testing: 🟢 Passed

Gemini features: 🟢 Working

Firestore persistence: 🟢 Working

Cross-user isolation: 🟢 Verified

Cloud Run: 🟡 Pending billing configuration

🙌 Acknowledgements

Built with Google's AI and cloud ecosystem, including:

Gemini
Google AI Studio
Firebase Authentication
Cloud Firestore
Google Cloud
<p align="center"> <strong>Built with curiosity. Secured with intention. Powered by Gemini. 🤖✨</strong> </p>
