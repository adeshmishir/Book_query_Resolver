import streamlit as st
from dotenv import load_dotenv

from src.loader import load_pdf
from src.splitter import split_documents
from src.vectorstore import create_vectorstore
from src.retriever import get_retriever
from src.rag import create_rag_chain, ask_question

load_dotenv()

st.set_page_config(
    page_title="Book Query Resolver",
    page_icon="📚",
    layout="wide",
)

st.title("📚 Book Query Resolver")
st.markdown("### Upload a PDF and ask questions about it.")

uploaded_file = st.file_uploader(
    "Choose a PDF",
    type=["pdf"]
)

if uploaded_file is not None:

    with st.spinner("Loading PDF..."):
        documents = load_pdf(uploaded_file)

    st.success(f"✅ PDF Loaded ({len(documents)} pages)")

    with st.spinner("Splitting document into chunks..."):
        chunks = split_documents(documents)

    st.success(f"✅ Created {len(chunks)} chunks")

    with st.spinner("Generating embeddings and building vector database..."):
        vectorstore = create_vectorstore(chunks)

    retriever = get_retriever(vectorstore)

    rag_chain = create_rag_chain(retriever)

    st.divider()

    question = st.text_input(
        "Ask a question about the uploaded book"
    )

    if st.button("Ask"):

        if question.strip() == "":
            st.warning("Please enter a question.")

        else:

            with st.spinner("Searching the book..."):

                answer = ask_question(
                    rag_chain,
                    question
                )

            st.subheader("Answer")

            st.write(answer)