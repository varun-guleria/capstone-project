import re
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def extract_negation(text: str) -> bool:
    negation_words = {"not", "isn't", "aren't", "incorrect", "invalid", "false", "except", "doesn't", "don't", "cannot", "can't"}
    words = set(text.lower().replace("?", "").replace(".", "").replace(",", "").split())
    return len(words.intersection(negation_words)) > 0

def extract_numbers(text: str) -> set:
    text_upper = text.upper()
    numbers = set(re.findall(r'\b\d+\b', text_upper))
    excel_ranges = set(re.findall(r'[A-Z]+\d+:[A-Z]+\d+', text_upper))
    return numbers.union(excel_ranges)

def extract_intent(text: str) -> str:
    text_lower = text.lower()
    if "full form" in text_lower or "stands for" in text_lower or "acronym" in text_lower:
        return "FULL_FORM"
    if "difference between" in text_lower or "compare" in text_lower or "distinguish" in text_lower:
        return "COMPARISON"
    if "advantage" in text_lower or "benefit" in text_lower:
        return "ADVANTAGE"
    if "disadvantage" in text_lower or "drawback" in text_lower:
        return "DISADVANTAGE"
    if "is true" in text_lower and not ("not true" in text_lower):
        return "TRUE_FALSE"
    if "is false" in text_lower or "not true" in text_lower or "incorrect" in text_lower:
        return "NOT_TRUE"
    if "valid" in text_lower and not "invalid" in text_lower:
        return "VALID_INVALID"
    if "invalid" in text_lower:
        return "NOT_TRUE"
    if "purpose of" in text_lower or "used for" in text_lower or "function of" in text_lower:
        return "FUNCTION"
    if "where" in text_lower or "location" in text_lower:
        return "LOCATION"
    if "sequence" in text_lower or "order" in text_lower or "steps" in text_lower:
        return "SEQUENCE"
    return "OTHER"

def extract_atp(text: str):
    doc = nlp(text)
    action_lemmas = set()
    target_lemmas = set()
    property_tokens = []
    
    for token in doc:
        if token.is_punct:
            continue
            
        # ACTION: Root verbs and main question words
        if token.pos_ == 'VERB' or token.tag_ in ['WP', 'WRB']:
            action_lemmas.add(token.lemma_.lower())
            
        # TARGET: Direct objects, nominal subjects, pobj (often the main target)
        elif token.dep_ in ['nsubj', 'nsubjpass', 'dobj', 'pobj']:
            if not token.is_stop:
                target_lemmas.add(token.lemma_.lower())
                
        # PROPERTY: Adjectival modifiers, compounds, and remaining nouns
        elif token.dep_ in ['amod', 'compound', 'attr', 'prep'] or token.pos_ in ['ADJ', 'NOUN']:
            if not token.is_stop:
                property_tokens.append(token.text.lower())
                
    # Reconstruct property string for embedding
    property_string = " ".join(property_tokens) if property_tokens else text
    
    return {
        "intent": extract_intent(text),
        "negation": extract_negation(text),
        "numbers": extract_numbers(text),
        "action_lemmas": action_lemmas,
        "target_lemmas": target_lemmas,
        "property_string": property_string,
        "raw_text": text
    }

def jaccard_similarity(set1, set2):
    if not set1 and not set2:
        return 1.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

def structural_short_circuit(f1, f2) -> bool:
    # 1. Hard Intent Mismatch (e.g. TRUE_FALSE vs NOT_TRUE)
    opposing_intents = [{"TRUE_FALSE", "NOT_TRUE"}, {"VALID_INVALID", "NOT_TRUE"}]
    intents = {f1["intent"], f2["intent"]}
    if intents in opposing_intents:
        return True # Short-circuit!
        
    # 2. Hard Negation Mismatch
    if f1["negation"] != f2["negation"]:
        return True # Short-circuit!

    return False # Continue to next stages!
