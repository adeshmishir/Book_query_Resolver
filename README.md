# Book Query Resolver

A RAG-powered book Q&A application. Chat with an assistant and optionally upload a PDF to answer questions strictly from the book content.

## Repository structure

```
Book_query_Resolver/
├── backend/
│   ├── api.py                 # FastAPI server: health, upload, chat, clear + session store
│   ├── main.py                # Legacy Streamlit app (retained for reference)
│   ├── src/                   # RAG pipeline (loader, splitter, vectorstore, rag, llm, ...)
│   ├── requirements.txt       # pip dependencies
│   ├── pyproject.toml         # uv project manifest
│   ├── uv.lock                # Locked dependency versions (uv)
│   ├── .env                   # API keys (gitignored — create from example below)
│   ├── .python-version        # Python 3.11
│   └── test.py                # Simple import smoke test
├── frontend/                  # React 19 + Vite chat UI (Tailwind CSS v4, oxlint)
├── books/                     # Shared static book data (e.g. python_book.pdf)
├── README.md
└── .gitignore
```

- `backend/` contains all Python code and configuration. Start everything from inside `backend/`.
- `frontend/` contains the React/Vite app and can be developed independently.
- `books/` holds static book files. The current RAG pipeline reads user-uploaded PDFs, but this folder is the natural home for pre-loaded books.

## Architecture

```
┌──────────────────────┐        HTTP (JSON / multipart)        ┌─────────────────────────┐
│  React Frontend      │ ─────────────────────────────────────▶ │  FastAPI Backend        │
│  (Vite + React 19)   │  /api/health  /api/upload              │  (backend/api.py, 8000) │
│  frontend/           │  /api/chat    /api/clear               │                         │
└──────────────────────┘                                        └────────────┬────────────┘
       Dev only: Vite dev server (port 5173)                                  │
       proxies /api → http://localhost:8000                                    │
                                                                               ▼
                                                                   ┌─────────────────────────┐
                                                                   │  RAG Pipeline (src/)    │
                                                                   └─────────────────────────┘
```

### How a request flows

1. **Frontend** renders the chat; the assistant answers general questions directly.
2. When the user **uploads a PDF**, the frontend POSTs it to `/api/upload` as `multipart/form-data` together with a `session_id`.
3. The **backend** parses the PDF with `PyPDFLoader` (LangChain), splits it into chunks, embeds the chunks with a HuggingFace sentence-transformer (`all-MiniLM-L6-v2`), stores them in a FAISS index, and builds a retrieval chain.
4. For every chat message, the frontend POSTs `{ message, session_id }` to `/api/chat`.
   - If a PDF is loaded for that session → a relevance check decides whether the question is answerable from the book context. If relevant → the answer is generated **only from the retrieved context**. If not → falls back to a general assistant answer.
   - If no PDF is loaded → the LLM answers as a general assistant.
5. Session state (`rag_chain`, file name, page/chunk counts, context summary) is kept in-memory per `session_id` so multiple browser tabs stay isolated.

### Backend source layout (`backend/src/`)

| Path | Purpose |
| --- | --- |
| `src/loader.py` | PDF → LangChain documents (via PyPDFLoader) |
| `src/splitter.py` | Document chunking |
| `src/vectorstore.py` | FAISS vector store (create/save/load) |
| `src/retriver.py` | Vector store → retriever |
| `src/embeddings.py` | HuggingFace embedding model |
| `src/llm.py` | Mistral LLM client (from env `MISTRAL_API_KEY`) |
| `src/rag.py` | Chat + RAG chains and answer helpers |
| `src/prompt.py` | RAG prompt template |

## Prerequisites

- Python 3.11
- [uv](https://docs.astral.sh/uv/) (or pip)
- Node.js (with npm)

## Setup

### Backend

```bash
cd backend
uv sync          # or: pip install -r requirements.txt
```

Create `backend/.env` with your API keys (the backend loads `.env` from its own directory):

```
MISTRAL_API_KEY=your_mistral_key
```

### Frontend

```bash
cd frontend
npm install
```

## Run

Open two terminals.

### Terminal 1 — API backend (http://localhost:8000)

```bash
cd backend
uv run uvicorn api:app --reload
```

> `api.py` is the FastAPI server. `main.py` is the legacy Streamlit UI (see below).

### Terminal 2 — React frontend (http://localhost:5173)

```bash
cd frontend
npm run dev
```

Open http://localhost:5173, upload a PDF from the sidebar, and start chatting.

In development the Vite dev server proxies `/api/*` to `http://localhost:8000` (`frontend/vite.config.js`), so the frontend talks to the backend through relative `/api` URLs. The backend `api.py` enables CORS for all origins for local development.

### Legacy (Streamlit)

The original Streamlit UI can still be started from `backend/`:

```bash
cd backend
uv run streamlit run main.py
```

## API Reference

| Method | Endpoint | Body | Response | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | — | `{ status: "ok" }` | Health check |
| `POST` | `/api/chat` | `{ message, session_id }` | `{ answer, using_pdf }` | Answer a question (uses PDF context if loaded) |
| `POST` | `/api/upload` | `multipart/form-data`: `session_id`, `file` | `{ filename, pages, chunks }` | Load a PDF and build the RAG chain |
| `POST` | `/api/clear` | `session_id` (form) | `{ cleared: true }` | Reset the session (drops PDF context) |