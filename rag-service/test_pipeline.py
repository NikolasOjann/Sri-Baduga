import sys
import os

# Menambahkan root project ke sys.path
sys.path.append(os.path.abspath("."))

from app.rag.pipeline import MuseumPipeline

def run_tests():
    pipeline = MuseumPipeline()
    session_id = "test_session_123"
    
    questions = [
        "golok",
        "galonggong",
        "terbuat dari apa?",
        "ada apa saja di museum",
        "termasuk jenis apa ini?"
    ]
    
    for q in questions:
        print("\n" + "="*80)
        print(f"QUESTION: {q}")
        print("="*80)
        
        # Reset clarification state if we want to test independent queries?
        # The user's flow actually includes "galonggong" after "golok", so it might trigger clarification selection if "galonggong" is a candidate. 
        # But wait, "galonggong" is not the exact candidate name, the candidate is "Golok Galonggong".
        # Let's just run them sequentially to simulate a real user session!
        
        try:
            result = pipeline.ask(q, session_id)
            print(f"\n[ANSWER]\n{result.get('answer', '')}")
            
            print("\n[SOURCES]")
            for s in result.get('sources', []):
                print(f"- {s.get('name')} ({s.get('category')} - {s.get('inventory')})")
        except Exception as e:
            print(f"\n[ERROR] {e}")

if __name__ == "__main__":
    print("Starting tests...")
    run_tests()
    print("Tests completed.")
