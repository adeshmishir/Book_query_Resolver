from langchain_core.prompts import ChatPromptTemplate


def get_prompt():
    """
    Returns the prompt template used for RAG.
    """

    prompt = ChatPromptTemplate.from_template(
        """
You are an intelligent AI assistant.

Answer the user's question ONLY using the provided context.

Rules:
1. Do not make up information.
2. If the answer is not present in the context, reply:
   "I couldn't find the answer in the uploaded book."
3. Keep the answer clear and concise.
4. If possible, answer using bullet points.

Context:
{context}

Question:
{question}

Answer:
"""
    )

    return prompt