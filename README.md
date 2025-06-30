# FusedAI

## Overview
FusedAI is an AI-powered full-stack playground inspired by tools like **Lovable**, **Cursor**, and the emerging **Model Context Protocol (MCP)**. It sits at the intersection of these platforms, combining Lovable's beautiful, AI-generated UIs with Cursor's context-aware, code-driven backend generation—all in a single, rapid prototyping environment. Built in just 6 hours, FusedAI demonstrates how fast and far you can go with modern AI and web tech.

## FusedAI & Model Context Protocol (MCP)
FusedAI is an early, practical application of the Model Context Protocol (MCP) vision. While it does not implement the full MCP standard, it demonstrates the core idea: **context-aware code generation**. When you generate backend code, FusedAI passes the current frontend prompt and code as context to the backend code generator, making backend generation aware of the UI and its requirements. This is a simplified, ad-hoc form of MCP—showing how even lightweight context passing can keep frontend and backend in sync. In the future, FusedAI could adopt a full MCP approach, sharing the entire project state and file tree with the model for even deeper integration, just like Cursor or Copilot Workspace.

## Demo

### 1. Frontend Prompt and Output
After entering a prompt like "Generate a login page for me" in the Frontend tab, FusedAI generates a beautiful, production-ready React component using both Tailwind CSS and Bootstrap. You see the generated code and a live preview side by side.

![Frontend Prompt and Output](./screenshots/frontend-prompt-output.png)

### 2. CodeSandbox View (Open in Sandbox)
Clicking "Open in Sandbox" launches the generated code in CodeSandbox, where you can see the full file structure, edit the code, and preview the UI in a real development environment.

![CodeSandbox View](./screenshots/codesandbox-view.png)

### 3. Backend Prompt and Output
Switching to the Backend tab, you can enter a prompt like "based on the login form generate flask api endpoints for user authentication". The backend generator is aware of your current frontend code and prompt, and generates matching backend code (e.g., FastAPI or Flask endpoints) that fits your UI.

![Backend Prompt and Output](./screenshots/backend-prompt-output.png)

## Why FusedAI?
Modern web development is often slow and fragmented, with frontend and backend teams working in silos. Lovable, Cursor, and MCP have shown the power of AI for UI and code generation, but there's a gap: a tool that keeps both frontend and backend in sync, context-aware, and instantly previewable. FusedAI bridges that gap.

## What It Does
- **Generate beautiful React UIs** using both Tailwind CSS and Bootstrap, just by describing what you want.
- **Generate backend endpoints** (FastAPI) that are context-aware of your frontend code and prompt.
- **See both sides together:** Instantly preview the UI and see the backend code that matches it.
- **Rapid prototyping:** Go from idea to code in seconds, perfect for hackathons, demos, or teaching.

## Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS, Bootstrap, Sandpack (live preview)
- **Backend:** FastAPI (Python), OpenAI API, python-dotenv
- **Dev Environment:** Codespaces or CodeSandbox (cloud-based, collaborative)

## How to Run

### 1. Clone the Repository
```
git clone <your-repo-url>
cd FusedAI
```

### 2. Backend Setup
```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env  # Add your OpenAI API key to .env
uvicorn main:app --reload
```

### 3. Frontend Setup
```
cd ../frontend
npm install
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

### 4. Usage
- Use the Frontend tab to generate UIs from prompts.
- Use the Backend tab to generate endpoints that are aware of your frontend code.
- See the generated code and live preview side by side.

---

**Note:** This is a rapid MVP built in 6 hours. For a true full-stack, live integration (where frontend and backend code are executed together), further setup (e.g., Docker Compose, shared file system, or a full MCP implementation) would be needed.

## Project Structure

```
FusedAI/
├── frontend/          # Next.js application with TailwindCSS
├── backend/           # FastAPI application with CORS
└── README.md         # This file
```

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

## Development

- Backend API documentation: `http://localhost:8000/docs`
- Frontend development server: `http://localhost:3000`

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Debug mode (default: True)
- `CORS_ORIGINS`: Allowed CORS origins (default: http://localhost:3000)

## Available Scripts

### Backend
- `uvicorn main:app --reload`: Start development server with auto-reload

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint 