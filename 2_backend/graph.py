from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import tools_condition
from langchain_core.messages import BaseMessage, SystemMessage
from langchain.chat_models import init_chat_model
from .config import WEBSITE_NAME, GEMINI_MODEL
from .tools import search_services

class SessionState(TypedDict):
    messages: Annotated[List[BaseMessage], "The chat messages in this session"]

llm = llm = init_chat_model(GEMINI_MODEL, model_provider="google_genai")

def query_or_respond(state: SessionState):
    llm_with_tools = llm.bind_tools([search_services])
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def tools_node(state: SessionState):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []
    for tool_call in tool_calls:
        try:
            tool_output = search_services.invoke(tool_call["args"])
            tool_messages.append({
                "type": "tool",
                "content": tool_output,
                "tool_call_id": tool_call["id"]
            })
        except Exception as e:
            tool_messages.append({
                "type": "tool",
                "content": f"Error: {str(e)}",
                "tool_call_id": tool_call["id"]
            })
    return {"messages": tool_messages}

def generate(state: SessionState):
    recent_tool_messages = [msg for msg in reversed(state["messages"]) if msg.type == "tool"]
    tool_messages = recent_tool_messages[::-1]

    docs_content = "\n\n".join(msg["content"] for msg in tool_messages if isinstance(msg["content"], str))
    system_message_content = (
        f"You are an AI assistant specialized in helping users discover and navigate services on {WEBSITE_NAME}. "
        "Use the retrieved service information to answer questions accurately. "
        "If the information isn't available or you don't know, say so. "
        "Keep answers helpful, concise, and focused on the user's query. "
        "For questions about services, provide details like title, URL, and relevant content. "
        "For procedural questions, provide step-by-step guidance if available in the context."
        "\n\n"
        f"Retrieved Services:\n{docs_content}"
    )
    conversation_messages = [
        msg for msg in state["messages"]
        if msg.type in ("human", "system") or (msg.type == "ai" and not msg.tool_calls)
    ]
    prompt = [SystemMessage(content=system_message_content)] + conversation_messages

    response = llm.invoke(prompt)
    return {"messages": [response]}

def compile_graph():
    graph_builder = StateGraph(SessionState)
    graph_builder.add_node("query_or_respond", query_or_respond)
    graph_builder.add_node("tools", tools_node)
    graph_builder.add_node("generate", generate)

    graph_builder.set_entry_point("query_or_respond")
    graph_builder.add_conditional_edges(
        "query_or_respond",
        tools_condition,
        {"END": END, "tools": "tools"},
    )
    graph_builder.add_edge("tools", "generate")
    graph_builder.add_edge("generate", END)

    return graph_builder.compile()