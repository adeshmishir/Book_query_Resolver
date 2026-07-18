from langchain_community.vectorstores import FAISS

from src.embeddings import get_embedding_model


def create_vectorstore(chunks):
    """
    Creates a FAISS vector database from document chunks.
    """

    embeddings = get_embedding_model()

    vectorstore = FAISS.from_documents(
        documents=chunks,
        embedding=embeddings,
    )

    return vectorstore


def save_vectorstore(vectorstore, path="faiss_index"):
    """
    Saves the FAISS vectorstore locally.
    """

    vectorstore.save_local(path)


def load_vectorstore(path="faiss_index"):
    """
    Loads a previously saved FAISS vectorstore.
    """

    embeddings = get_embedding_model()

    vectorstore = FAISS.load_local(
        folder_path=path,
        embeddings=embeddings,
        allow_dangerous_deserialization=True,
    )

    return vectorstore