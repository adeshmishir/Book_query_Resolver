

import tempfile

from langchain_community.document_loaders import PyPDFLoader


def load_pdf(uploaded_file):
    """
    Loads an uploaded PDF file and returns LangChain Document objects.
    """

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(uploaded_file.read())
        pdf_path = temp_file.name

    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    return documents