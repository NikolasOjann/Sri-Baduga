import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

from app.agent.planner import Planner
from app.core.dependencies import get_llm

planner = Planner(
    get_llm()
)

questions = [

    "Apa itu Kujang?",

    "Koleksi museum apa saja?",

    "Siapa presiden Indonesia pertama?",

    "Terbuat dari apa Kujang?"

]

for q in questions:

    print("="*60)

    print(q)

    print()

    result = planner.plan(q)

    print(result)

    print()