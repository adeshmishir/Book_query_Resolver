from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

from src.llm import get_llm
from src.prompt import get_prompt


def create_rag_chain(retriever):
    """
    Creates and returns the complete RAG pipeline.
    """

    llm = get_llm()
    prompt = get_prompt()

    document_chain = create_stuff_documents_chain(
        llm=llm,
        prompt=prompt,
    )

    rag_chain = create_retrieval_chain(
        retriever=retriever,
        combine_docs_chain=document_chain,
    )

    return rag_chain


def ask_question(rag_chain, question):
    """
    Runs the RAG chain on the user's question.
    """

    response = rag_chain.invoke(
        {
            "input": question
        }
    )

    return response["answer"]