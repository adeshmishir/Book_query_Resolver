import os
import tempfile
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.loader import load_pdf
from src.rag import ask_general_question, ask_question, create_chat_chain, create_rag_chain
from src.retriver import get_retriever
from src.splitter import split_documents
from src.vectorstore import create_vectorstore

load_dotenv()

app = FastAPI(title="Book Query Resolver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, dict] = {}


def get_session(session_id: str) -> dict:
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    if session_id not in sessions:
        sessions[session_id] = {
            "rag_chain": None,
            "filename": None,
            "pages": 0,
            "chunks": 0,
        }

    return sessions[session_id]


class ChatRequest(BaseModel):
    message: str
    session_id: str


class ChatResponse(BaseModel):
    answer: str
    using_pdf: bool


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session = get_session(req.session_id)
    rag_chain = session["rag_chain"]

    if rag_chain is not None:
        answer = ask_question(rag_chain, req.message)
    else:
        chat_chain = create_chat_chain()
        answer = ask_general_question(chat_chain, req.message)

    return ChatResponse(answer=answer, using_pdf=rag_chain is not None)


@app.post("/api/upload")
async def upload_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    if (await file.read(1)) == b"":
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    session = get_session(session_id)
    temp_path = None

    try:
        fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, "wb") as temp_file:
            await file.seek(0)
            temp_file.write(await file.read())

        with open(temp_path, "rb") as pdf_file:
            documents = load_pdf(pdf_file)

        chunks = split_documents(documents)
        vectorstore = create_vectorstore(chunks)
        retriever = get_retriever(vectorstore)

        session["rag_chain"] = create_rag_chain(retriever)
        session["filename"] = file.filename
        session["pages"] = len(documents)
        session["chunks"] = len(chunks)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "filename": session["filename"],
        "pages": session["pages"],
        "chunks": session["chunks"],
    }


@app.post("/api/clear")
def clear_session(session_id: str = Form(...)):
    session = get_session(session_id)
    session["rag_chain"] = None
    session["filename"] = None
    session["pages"] = 0
    session["chunks"] = 0

    return {"cleared": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)