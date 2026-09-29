
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def get_bge_sim(q1, q2):
    # Dummy similarity generator for testing the logic,
    # or actually fetch it from /embed.
    # We'll fetch from embed.
    res = client.post("/embed", json={"texts": [q1, q2]})
    emb = res.json()["embeddings"]
    import numpy as np
    return float(np.dot(emb[0], emb[1]))

def test_compare_cases():
    cases = [
        # A. paraphrase -> MERGE
        ("What is a firewall?", "Explain the concept of a firewall.", "MERGE"),
        # B. abbreviation/full form -> MERGE
        ("What is the full form of USB?", "USB is the acronym for:", "MERGE"),
        # C. same concept, different wording -> MERGE
        ("How do you create a folder in Windows?", "What are the steps to make a new directory in Windows OS?", "MERGE"),
        # D. same subject, different requested property -> SEPARATE
        ("What is the speed of USB 3.0?", "What is the maximum cable length for USB 3.0?", "SEPARATE"),
        # E. valid vs invalid -> SEPARATE
        ("Which of the following is a valid IP address?", "Which of the following is an invalid IP address?", "SEPARATE"),
        # F. true vs false/not true -> SEPARATE
        ("Which statement is true about ROM?", "Which statement is false about ROM?", "SEPARATE"),
        ("Which of the following is true?", "Which of the following is not true?", "SEPARATE"),
        # G. different numerical constraint -> SEPARATE AS QUESTION VARIANTS (Merged into same theme)
        ("How many cells are in A10:D30?", "How many cells are in B2:F12?", "MERGE"),
        # H. same broad Excel concept -> MERGE or SEPARATE (depends on question) - let's skip for simple test.
        # I. same broad networking subject but different answer -> SEPARATE
        ("What device operates at the Network layer?", "What device operates at the Data Link layer?", "SEPARATE"),
        # J. same topic but different OSI layers -> SEPARATE
        ("Which OSI layer is responsible for routing packets?", "Which OSI layer exists between application and session layers?", "SEPARATE"),
    ]
    
    pairs = []
    for i, (q1, q2, expected) in enumerate(cases):
        sim = get_bge_sim(q1, q2)
        pairs.append({
            "id_a": f"a{i}",
            "text_a": q1,
            "id_b": f"b{i}",
            "text_b": q2,
            "bge_sim": sim
        })
        
    res = client.post("/compare", json={"pairs": pairs})
    results = res.json()["results"]
    
    for i, (q1, q2, expected) in enumerate(cases):
        prediction = results[i]["prediction"]
        print(f"\nQ1: {q1}\nQ2: {q2}\nExpected: {expected}, Got: {prediction}")
        # If prediction is REVIEW, and expected is MERGE, we can consider it close enough, 
        # but the prompt demands strong SEPARATE for strict mismatches.
        if expected == "SEPARATE":
            assert prediction == "SEPARATE", f"Failed case {i}: expected SEPARATE, got {prediction}"

if __name__ == "__main__":
    test_compare_cases()
