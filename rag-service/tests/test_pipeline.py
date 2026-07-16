import os
import sys

sys.path.append(

    os.path.dirname(

        os.path.dirname(__file__)

    )

)

from app.rag.pipeline import MuseumPipeline

pipeline = MuseumPipeline()

questions = [

    "Apa itu Kujang?",

    "Apa fungsi Kujang?",

    "Kujang berasal dari mana?",

    "Terbuat dari apa?",

    "Mahkota Binokasih",

    "Apa itu Machine Learning?",

    "Halo"

]

session = "demo"

for q in questions:

    print()

    print("="*80)

    print("QUESTION")

    print(q)

    print("="*80)

    result = pipeline.ask(

        q,

        session

    )

    print()

    print("ANSWER")

    print(result["answer"])

    print()

    print("SOURCES")

    for source in result["sources"]:

        print(source)

    print()