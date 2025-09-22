from typing import List
from langchain_core.tools import tool
from .database import get_services_with_similarity
from .models import Service

@tool
def search_services(query: str) -> str:
    """Search for relevant services using fuzzy matching on titles."""
    services = get_services_with_similarity(query)
    if not services:
        return "No relevant services found."
    
    serialized = "\n\n".join(
        (f"Title: {service.title}\nURL: {service.url}\nContent: {service.content}")
        for service in services
    )
    return serialized