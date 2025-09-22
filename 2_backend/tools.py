from typing import List
from langchain_core.tools import tool
from .database import get_services_with_similarity
from .models import Service
from .utils.load_csv import extract_matt_param

@tool
def search_services(query: str, url: str = None) -> str:
    """
    Search for relevant services using fuzzy matching on titles.
    Optionally filter by matt parameter from a URL.
    """
    matt = extract_matt_param(url) if url else None
    services = get_services_with_similarity(query)
    if matt:
        services = [s for s in services if str(s.id) == matt]  # Match by matt if provided
    
    if not services:
        return "No relevant services found."
    
    serialized = "\n\n".join(
        (f"Title: {service.title}\nURL: {service.url}\nContent: {service.content}")
        for service in services
    )
    return serialized