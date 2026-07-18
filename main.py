import streamlit as st
from dotenv import load_dotenv

from src.loader import load_pdf
from src.splitter import split_documents
from src.vectorstore import create_vectorstore
from src.retriver import get_retriever
from src.rag import create_rag_chain, ask_question, create_chat_chain, ask_general_question

load_dotenv()

st.set_page_config(
    page_title="Book Query Resolver",
    page_icon="📚",
    layout="wide",
)

st.title("📚 Book Query Resolver")
st.markdown("### Chat with the assistant, with optional PDF context.")

if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "Hello. Ask me anything. If you upload a PDF, I can answer using that document too."
        }
    ]

if "chat_chain" not in st.session_state:
    st.session_state.chat_chain = create_chat_chain()

if "rag_chain" not in st.session_state:
    st.session_state.rag_chain = None

with st.sidebar:
    st.header("PDF Mode")
    uploaded_file = st.file_uploader(
        "Optional: upload a PDF for book-specific answers",
        type=["pdf"]
    )

    if uploaded_file is not None:
        with st.spinner("Loading PDF..."):
            documents = load_pdf(uploaded_file)

        with st.spinner("Splitting document into chunks..."):
            chunks = split_documents(documents)

        with st.spinner("Generating embeddings and building vector database..."):
            vectorstore = create_vectorstore(chunks)

        retriever = get_retriever(vectorstore)
        st.session_state.rag_chain = create_rag_chain(retriever)

        st.success(f"PDF ready: {len(documents)} pages, {len(chunks)} chunks")

    if st.button("Clear chat"):
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "Hello. Ask me anything. If you upload a PDF, I can answer using that document too."
            }
        ]
        st.rerun()

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])

question = st.chat_input("Type your message")

if question:
    st.session_state.messages.append({"role": "user", "content": question})

    with st.chat_message("user"):
        st.write(question)

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            if st.session_state.rag_chain is not None:
                answer = ask_question(st.session_state.rag_chain, question)
            else:
                answer = ask_general_question(st.session_state.chat_chain, question)

        st.write(answer)

    st.session_state.messages.append({"role": "assistant", "content": answer})