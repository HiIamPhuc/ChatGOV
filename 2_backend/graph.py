from typing import Annotated
from langgraph.graph import StateGraph, END, MessagesState
from langgraph.prebuilt import tools_condition, ToolNode
from langchain_core.messages import SystemMessage
from langchain.chat_models import init_chat_model
from .config import GEMINI_MODEL
from .tools import search_services_by_similarity
from .prompts import SYSTEM_PROMPT

class ChatState(MessagesState):
    user_profile: Annotated[dict, "Contain user profile"] = {}

llm = init_chat_model(GEMINI_MODEL, model_provider="google_genai")

def query_or_respond(state: ChatState):
    # Add system message at the start of conversation
    messages = [SystemMessage(content=SYSTEM_PROMPT.invoke(
        {"docs_content": "", "user_profile": ""}
    ).to_string())] + state["messages"]
    
    llm_with_tools = llm.bind_tools([search_services_by_similarity])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tools_node = ToolNode([search_services_by_similarity])

def generate(state: ChatState):
    recent_tool_messages = []
    for message in reversed(state["messages"]):
        if message.type == "tool":
            recent_tool_messages.append(message)
        else:
            break
    tool_messages = recent_tool_messages[::-1]
    docs_content = "\n\n".join(doc.content for doc in tool_messages) if tool_messages else ""

    system_message_content = (
        SYSTEM_PROMPT.invoke({
            "docs_content": docs_content if docs_content.strip() or any("tool" in msg.type for msg in state["messages"]) else "",
            "user_profile": state['user_profile']
        }).to_string() 
    )
    print(system_message_content)

    conversation_messages = [
        msg
        for msg in state["messages"]
        if msg.type in ("human", "system")
        or (msg.type == "ai" and not msg.tool_calls)
    ]
    prompt = [SystemMessage(content=system_message_content)] + conversation_messages
    response = llm.invoke(prompt)
    return {"messages": [response]}

def compile_graph():
    graph_builder = StateGraph(ChatState)
    graph_builder.add_node("query_or_respond", query_or_respond)
    graph_builder.add_node("tools", tools_node)
    graph_builder.add_node("generate", generate)

    graph_builder.set_entry_point("query_or_respond")
    graph_builder.add_conditional_edges(
        "query_or_respond",
        tools_condition,
        {"__end__": END, "tools": "tools"},
    )
    graph_builder.add_edge("tools", "generate")
    graph_builder.add_edge("generate", END)

    return graph_builder.compile()