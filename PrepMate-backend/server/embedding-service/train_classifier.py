import json
import random
import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from features import get_features, compare_features

def load_data():
    questions = []
    # Load all questions from raw_papers
    data_dir = '../data/raw_papers'
    if not os.path.exists(data_dir):
        return []
    
    for filename in os.listdir(data_dir):
        if filename.endswith('.txt'):
            with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '-' in line or ':' in line or ',' in line:
                        # try to split by first occurrence of -, : or , after year
                        import re
                        match = re.match(r'^((?:19|20)\d{2})\s*[,|:-]\s*(.+)$', line)
                        if match:
                            questions.append(match.group(2).strip())
    return list(set(questions))

def create_training_data(questions, embedder, reranker):
    if len(questions) == 0:
        return [], []
    
    # Generate embeddings
    embeddings = embedder.encode(questions, normalize_embeddings=True)
    
    X = []
    y = []
    
    print("Generating pairs...")
    
    # We create some positive and negative pairs.
    # Since we don't have labeled data, we will synthetically create some hard negatives and positives.
    # We will use some heuristics.
    
    # This is a naive heuristic for training if no manual labels exist.
    # In a real scenario, we'd want manual labels. We'll generate some synthetic ones based on rules for demonstration.
    # For a robust system, the user should provide a manually labeled dataset.
    
    # For now, let's create a dummy dataset based on BGE similarity and some rules.
    # A true positive might be something very similar > 0.9.
    # A hard negative might be > 0.8 but different intent/numbers.
    
    for i in range(len(questions)):
        for j in range(i+1, min(i+50, len(questions))): # Limit pairs to avoid O(N^2) explosion
            q1 = questions[i]
            q2 = questions[j]
            
            emb1 = embeddings[i]
            emb2 = embeddings[j]
            bge_sim = np.dot(emb1, emb2)
            
            f1 = get_features(q1)
            f2 = get_features(q2)
            comp = compare_features(f1, f2)
            
            # Let's define pseudo-labels
            # If BGE sim is very high (> 0.9) and features match -> 1
            # If BGE sim is high (> 0.7) but features mismatch -> 0 (hard negative)
            # If BGE sim is low (< 0.5) -> 0 (easy negative)
            
            label = None
            if bge_sim > 0.9 and comp['negation_match'] == 1.0 and comp['intent_match'] >= 0.5:
                label = 1
            elif bge_sim > 0.85 and comp['negation_match'] == 1.0 and comp['numeric_match'] == 0.0 and comp['entity_match'] > 0.5:
                # Same broad theme, different numbers -> MERGE (they are variants)
                label = 1
            elif bge_sim > 0.7 and (comp['negation_match'] == 0.0 or (comp['numeric_match'] == 0.0 and comp['entity_match'] < 0.5) or comp['intent_match'] == 0.0):
                label = 0
            elif bge_sim < 0.4:
                label = 0
                
            if label is not None:
                # Get reranker score
                rerank_score = reranker.predict([q1, q2])
                
                features = [
                    bge_sim,
                    rerank_score,
                    comp['negation_match'],
                    comp['numeric_match'],
                    comp['intent_match'],
                    comp['entity_match'],
                    comp['topic_match'],
                    comp['lexical_match']
                ]
                X.append(features)
                y.append(label)
                
    return np.array(X), np.array(y)

if __name__ == "__main__":
    print("Loading models...")
    os.makedirs('models', exist_ok=True)
    
    embedder = SentenceTransformer('BAAI/bge-base-en-v1.5', cache_folder='models')
    reranker = CrossEncoder('BAAI/bge-reranker-base', max_length=512, cache_dir='models')
    
    print("Loading questions...")
    questions = load_data()
    
    print(f"Loaded {len(questions)} unique questions.")
    
    X, y = create_training_data(questions, embedder, reranker)
    
    if len(X) > 0:
        print(f"Training on {len(X)} samples...")
        clf = LogisticRegression(class_weight='balanced')
        clf.fit(X, y)
        
        preds = clf.predict(X)
        print("Train Accuracy:", accuracy_score(y, preds))
        print("Train Precision:", precision_score(y, preds))
        print("Train Recall:", recall_score(y, preds))
        
        with open('models/classifier.pkl', 'wb') as f:
            pickle.dump(clf, f)
        print("Saved classifier to models/classifier.pkl")
    else:
        print("No training data generated.")
