import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

from app.agent.chat_agent import ChatAgent

from app.core.dependencies import (

    get_llm,

    get_retriever

)

# Register Tool
get_retriever()

agent = ChatAgent(

    get_llm()

)

questions = [

    "Apa itu Kujang?",

    "Koleksi museum",

    "Siapa presiden pertama Indonesia?"

]

for q in questions:

    print("="*60)

    print(q)

    print()

    result = agent.run(q)

    print(result)

    print()