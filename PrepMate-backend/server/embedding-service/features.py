import re
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def extract_negation(text: str) -> bool:
    negation_words = {"not", "isn't", "aren't", "incorrect", "invalid", "false", "except", "doesn't", "don't", "cannot", "can't", "isn't a"}
    words = set(text.lower().replace("?", "").replace(".", "").replace(",", "").split())
    return len(words.intersection(negation_words)) > 0

def extract_numbers(text: str) -> set:
    # Extracts standalone numbers and Excel-like ranges (e.g. A10:D30)
    text_upper = text.upper()
    numbers = set(re.findall(r'\b\d+\b', text_upper))
    excel_ranges = set(re.findall(r'[A-Z]+\d+:[A-Z]+\d+', text_upper))
    return numbers.union(excel_ranges)

def extract_intent(text: str) -> str:
    text_lower = text.lower()
    if "full form" in text_lower or "stands for" in text_lower or "acronym" in text_lower or "abbreviation" in text_lower:
        return "FULL_FORM"
    if "difference between" in text_lower or "compare" in text_lower or "distinguish" in text_lower:
        return "COMPARISON"
    if "advantage" in text_lower or "benefit" in text_lower or "merit" in text_lower:
        return "ADVANTAGE"
    if "disadvantage" in text_lower or "drawback" in text_lower or "demerit" in text_lower:
        return "DISADVANTAGE"
    if "shortcut" in text_lower or "key" in text_lower:
        return "SHORTCUT"
    if "command" in text_lower:
        return "COMMAND"
    if "how many" in text_lower or "count" in text_lower:
        return "COUNT"
    if "is true" in text_lower and not ("not true" in text_lower):
        return "TRUE_FALSE"
    if "is false" in text_lower or "not true" in text_lower or "incorrect" in text_lower:
        return "NOT_TRUE"
    if "valid" in text_lower and not "invalid" in text_lower:
        return "VALID_INVALID"
    if "invalid" in text_lower:
        return "NOT_TRUE"
    if "purpose of" in text_lower or "used for" in text_lower or "function of" in text_lower or "responsible for" in text_lower:
        return "FUNCTION"
    if "what is" in text_lower or "define" in text_lower or "definition" in text_lower:
        return "DEFINITION"
    if "where" in text_lower or "location" in text_lower:
        return "LOCATION"
    if "sequence" in text_lower or "order" in text_lower:
        return "SEQUENCE"
    if "output" in text_lower:
        return "OUTPUT"
    
    return "OTHER"

def extract_entities_and_topics(text: str):
    doc = nlp(text)
    entities = set([ent.text.lower() for ent in doc.ents])
    # Extract noun chunks as topics/keywords
    noun_chunks = set([chunk.text.lower() for chunk in doc.noun_chunks])
    # Remove stop words and short words
    keywords = set([token.lemma_.lower() for token in doc if not token.is_stop and not token.is_punct and len(token.text) > 2])
    return entities, noun_chunks, keywords

def get_features(text: str):
    entities, noun_chunks, keywords = extract_entities_and_topics(text)
    return {
        "negation": extract_negation(text),
        "numbers": extract_numbers(text),
        "intent": extract_intent(text),
        "entities": entities,
        "noun_chunks": noun_chunks,
        "keywords": keywords
    }

def jaccard_similarity(set1, set2):
    if not set1 and not set2:
        return 1.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

def compare_features(f1, f2):
    # Compare negations (if one is negated and other is not, it's a mismatch)
    negation_match = 1.0 if f1["negation"] == f2["negation"] else 0.0
    
    # Compare numbers (if either has numbers, they should match to be 1.0)
    num1 = f1["numbers"]
    num2 = f2["numbers"]
    numeric_match = 1.0
    if len(num1) > 0 or len(num2) > 0:
        if num1 == num2:
            numeric_match = 1.0
        else:
            numeric_match = 0.0 # Numbers differ
            
    # Intent match
    intent_match = 1.0 if f1["intent"] == f2["intent"] else 0.0
    if f1["intent"] == "OTHER" and f2["intent"] == "OTHER":
        intent_match = 0.5 # Neutral if both are OTHER
        
    # Entities / Topics match
    entity_match = jaccard_similarity(f1["entities"], f2["entities"])
    topic_match = jaccard_similarity(f1["noun_chunks"], f2["noun_chunks"])
    lexical_match = jaccard_similarity(f1["keywords"], f2["keywords"])
        
    return {
        "negation_match": negation_match,
        "numeric_match": numeric_match,
        "intent_match": intent_match,
        "entity_match": entity_match,
        "topic_match": topic_match,
        "lexical_match": lexical_match
    }
