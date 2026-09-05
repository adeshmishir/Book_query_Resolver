import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def get_llm():
    """
    Returns the Mistral LLM.
    """

    llm = ChatMistralAI(
        model="mistral-small-latest",
        api_key=os.getenv("MISTRAL_API_KEY"),
        temperature=0.2,
        
    )

    return llm