import os
import sys

sys.path.append(

    os.path.dirname(

        os.path.dirname(__file__)

    )

)

from app.services.chat_service import ChatService

chat = ChatService()

tests = [

    {

        "question":"Apa itu Kujang?",

        "expected":True

    },

    {

        "question":"Apa fungsi Kujang?",

        "expected":True

    },

    {

        "question":"Kujang berasal dari mana?",

        "expected":True

    },

    {

        "question":"Terbuat dari apa?",

        "expected":True

    },

    {

        "question":"Mahkota Binokasih",

        "expected":False

    },

    {

        "question":"Apa itu Machine Learning?",

        "expected":False

    }

]

pass_count = 0

print()

print("="*70)

print("SYSTEM TEST")

print("="*70)

for test in tests:

    result = chat.ask(

        test["question"],

        "system"

    )

    answer = result["answer"]

    found = len(

        result["sources"]

    ) > 0

    ok = (

        found == test["expected"]

    )

    print()

    print("-"*60)

    print(test["question"])

    print()

    print(answer)

    print()

    print("Sources :", len(result["sources"]))

    print()

    print(

        "PASS"

        if ok else

        "FAIL"

    )

    if ok:

        pass_count += 1

print()

print("="*70)

print(

    "TOTAL PASS",

    pass_count,

    "/",

    len(tests)

)

print("="*70)