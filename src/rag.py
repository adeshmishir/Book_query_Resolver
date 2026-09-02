from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate

from src.llm import get_llm
from src.prompt import get_prompt


def _relevance_llm():
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You decide whether a user question is answerable from the provided book summary. "
                "If the question is about the document itself (title, topics, what it covers) or the "
                "topics in the summary, reply ONLY with: yes. For any question, even a question that "
                "needs external knowledge, reply ONLY with: no. Reply with exactly one word.",
            ),
            ("human", "Book summary:\n{summary}\n\nQuestion: {question}"),
        ]
    )
    return prompt | llm


def is_relevant(question: str, summary: str) -> bool:
    chain = _relevance_llm()
    response = chain.invoke({"summary": summary, "question": question})
    text = getattr(response, "content", str(response)).strip().lower()
    return text.startswith("yes")


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


def create_chat_chain():
    """
    Creates a direct chat chain for normal assistant conversations.
    """

    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful AI assistant. Answer clearly and concisely."),
            ("human", "{input}"),
        ]
    )

    return prompt | llm


def ask_general_question(chat_chain, question):
    """
    Runs the direct chat chain for normal conversations.
    """

    response = chat_chain.invoke(
        {
            "input": question
        }
    )

    return getattr(response, "content", str(response))