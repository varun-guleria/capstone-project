import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from features import get_features, compare_features
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score

def load_data():
    questions = []
    data_dir = '../data/raw_papers'
    if not os.path.exists(data_dir):
        return []
    for filename in os.listdir(data_dir):
        if filename.endswith('.txt'):
            with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '-' in line or ':' in line or ',' in line:
                        import re
                        match = re.match(r'^((?:19|20)\d{2})\s*[,|:-]\s*(.+)$', line)
                        if match:
                            questions.append(match.group(2).strip())
    return list(set(questions))

def create_eval_data(questions, embedder, reranker):
    embeddings = embedder.encode(questions, normalize_embeddings=True)
    X, y = [], []
    for i in range(len(questions)):
        for j in range(i+1, min(i+50, len(questions))):
            q1, q2 = questions[i], questions[j]
            bge_sim = np.dot(embeddings[i], embeddings[j])
            
            f1, f2 = get_features(q1), get_features(q2)
            comp = compare_features(f1, f2)
            
            label = None
            if bge_sim > 0.9 and comp['negation_match'] == 1.0 and comp['intent_match'] >= 0.5:
                label = 1
            elif bge_sim > 0.85 and comp['negation_match'] == 1.0 and comp['numeric_match'] == 0.0 and comp['entity_match'] > 0.5:
                label = 1
            elif bge_sim > 0.7 and (comp['negation_match'] == 0.0 or (comp['numeric_match'] == 0.0 and comp['entity_match'] < 0.5) or comp['intent_match'] == 0.0):
                label = 0
            elif bge_sim < 0.4:
                label = 0
                
            if label is not None:
                rerank_score = reranker.predict([q1, q2])
                features = [
                    bge_sim, rerank_score, comp['negation_match'], comp['numeric_match'],
                    comp['intent_match'], comp['entity_match'], comp['topic_match'], comp['lexical_match']
                ]
                X.append(features)
                y.append(label)
    return np.array(X), np.array(y)

if __name__ == "__main__":
    embedder = SentenceTransformer('BAAI/bge-base-en-v1.5', cache_folder='models')
    reranker = CrossEncoder('BAAI/bge-reranker-base', max_length=512, cache_dir='models')
    
    with open('models/classifier.pkl', 'rb') as f:
        clf = pickle.load(f)
        
    questions = load_data()
    # Evaluate on a slice to act as "validation"
    X_val, y_true = create_eval_data(questions[-100:], embedder, reranker)
    
    if len(X_val) == 0:
        print("Not enough evaluation data.")
        exit(0)
        
    y_pred = clf.predict(X_val)
    
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    # Over-merging rate = FP / (FP + TN)
    over_merging = fp / (fp + tn) if (fp + tn) > 0 else 0
    # Under-merging rate = FN / (TP + FN)
    under_merging = fn / (tp + fn) if (tp + fn) > 0 else 0
    
    print("=== SEMANTIC MERGING EVALUATION ===")
    print(f"True Positives (Correct Merges): {tp}")
    print(f"False Positives (Over-merges): {fp}")
    print(f"True Negatives (Correct Separates): {tn}")
    print(f"False Negatives (Under-merges): {fn}")
    print("-----------------------------------")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("-----------------------------------")
    print(f"OVER-MERGING RATE:  {over_merging:.2%}")
    print(f"UNDER-MERGING RATE: {under_merging:.2%}")
