# Book Query Resolver

A RAG-powered book Q&A application. Chat with an assistant and optionally upload a PDF to answer questions strictly from the book content.

## Architecture

```
┌──────────────────────┐        HTTP (JSON / multipart)        ┌─────────────────────────┐
│  React Frontend      │ ─────────────────────────────────────▶ │  FastAPI Backend        │
│  (Vite + React 19)   │  /api/health  /api/upload              │  (api.py, port 8000)    │
│  frontend/           │  /api/chat    /api/clear               │                         │
└──────────────────────┘                                        └────────────┬────────────┘
       Dev only: Vite dev server (port 5173)                                  │
       proxies /api → http://localhost:8000                                    │
                                                                              ▼
                                                                  ┌─────────────────────────┐
                                                                  │  RAG Pipeline (src/)    │
                                                                  │                         │
   ┌─────────────────────────┐   ┌─────────────────────────────────────────────┐            │
   │ Uploaded PDF (user)     │──▶│  loader.load_pdf      → splitter.split       │            │
   │ books/*.pdf, browser    │   │  vectorstore.create   → retriver.get_retriever│           │
   └─────────────────────────┘   └─────────────────────────────────────────────┘            │
                                                                  │ chain: rag.ask_question   │
                                                                  ▼                         │
                                                  ┌────────────────────────────┐            │
                                                  │  LLM: Mistral (ChatMistralAI)│           │
                                                  │  Embeddings: HuggingFace     │            │
                                                  │  all-MiniLM-L6-v2 (FAISS)    │            │
                                                  └────────────────────────────┘            │
```

### How a request flows

1. **Frontend** renders the chat; the assistant answers general questions directly.
2. When the user **uploads a PDF**, the frontend POSTs it to `/api/upload` as `multipart/form-data` together with a `session_id`.
3. The **backend** parses the PDF with `pypdf`, splits it into chunks, embeds the chunks with a HuggingFace sentence-transformer (`all-MiniLM-L6-v2`), stores them in a FAISS index, and builds a retrieval chain.
4. For every chat message, the frontend POSTs `{ message, session_id }` to `/api/chat`.
   - If a PDF is loaded for that session → the answer is generated **only from the retrieved context**.
   - Otherwise → the LLM answers as a general assistant.
5. Session state (`rag_chain`, file name, page/chunk counts) is kept in-memory per `session_id` so multiple browser tabs stay isolated.

### Source layout

| Path | Purpose |
| --- | --- |
| `api.py` | FastAPI server: health, upload, chat, clear endpoints + session store |
| `main.py` | Legacy Streamlit app (retained for reference) |
| `src/loader.py` | PDF → LangChain documents |
| `src/splitter.py` | Document chunking |
| `src/vectorstore.py` | FAISS vector store (create/save/load) |
| `src/retriver.py` | Vector store → retriever |
| `src/embeddings.py` | HuggingFace embedding model |
| `src/llm.py` | Mistral LLM client (from env `MISTRAL_API_KEY`) |
| `src/rag.py` | Chat + RAG chains and answer helpers |
| `src/prompt.py` | RAG prompt template |
| `frontend/` | React (Vite) chat UI |

## Prerequisites

- Python 3.11
- [uv](https://docs.astral.sh/uv/) (or pip)
- Node.js (with npm)

## Setup

```bash
# Backend dependencies
uv sync

# Frontend dependencies
cd frontend
npm install
cd ..
```

Create a `.env` file with your API keys:

```
MISTRAL_API_KEY=your_mistral_key
```

Optionally `GROQ_API_KEY` and `HUGGINGFACEHUB_API_TOKEN` (used for the hosted embeddings/legacy pieces).

## Run

```bash
# Terminal 1 — API backend (http://localhost:8000)
uv run uvicorn api:app --reload

# Terminal 2 — React frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open http://localhost:5173, upload a PDF from the sidebar, and start chatting.

> If `uv` complains about a stale/mismatched `VIRTUAL_ENV`, prefix commands with `unset VIRTUAL_ENV;` or run `source .venv/Scripts/activate` in Git Bash and use the venv scripts directly.

### Legacy (Streamlit)

The original Streamlit UI can still be started with:

```bash
uv run streamlit run main.py
```

## API Reference

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/chat` | `{ message, session_id }` | Answer a question (uses PDF context if loaded) |
| `POST` | `/api/upload` | `multipart/form-data`: `session_id`, `file` | Load a PDF and build the RAG chain |
| `POST` | `/api/clear` | `session_id` (form) | Reset the session (drops PDF context) |