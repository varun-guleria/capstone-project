from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List

# Load the BGE model. It will be downloaded on the first run.
# This model is powerful for understanding semantic similarity.
model = SentenceTransformer('BAAI/bge-base-en-v1.5')

app = FastAPI()

# Define the data structure we expect in the request body
class EmbeddingRequest(BaseModel):
    texts: List[str]

@app.get("/")
def read_root():
    return {"status": "Embedding service is running"}

@app.post("/embed")
def create_embeddings(request: EmbeddingRequest):
    """
    Generates sentence embeddings for a list of input texts.
    """
    try:
        # Generate embeddings. The model maps sentences & paragraphs to a 768-dimensional dense vector space.
        embeddings = model.encode(request.texts, normalize_embeddings=True)
        return {"embeddings": embeddings.tolist()}
    except Exception as e:
        return {"error": str(e)}