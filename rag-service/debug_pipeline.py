from app.rag.pipeline import MuseumPipeline


def run_session(query, pick_index=0):
    session_id = "debug-session"

    pipeline = MuseumPipeline()

    print("ASK:", query)
    res = pipeline.ask(query, session_id)

    print("RESPONSE:")
    print(res["answer"])

    # if clarification, pick first candidate
    if res["documents"] == [] and "Silakan pilih" in res["answer"]:
        # get candidates from memory via pipeline.memory
        candidates = pipeline.memory.get_candidates(session_id)
        print("CANDIDATES:", candidates)
        if not candidates:
            return
        choice = candidates[pick_index]
        print("CHOOSING:", choice)
        res2 = pipeline.ask(choice, session_id)
        print("RESPONSE 2:")
        print(res2["answer"])
        print("SOURCES:", res2.get("sources"))


if __name__ == '__main__':
    run_session("apa itu golok")
