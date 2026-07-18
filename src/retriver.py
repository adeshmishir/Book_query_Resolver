from langchain_core.vectorstores import VectorStoreRetriever


def get_retriever(vectorstore, k=4):
    """
    Creates a retriever from the FAISS vector store.
    """

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": k
        }
    )

    return retriever