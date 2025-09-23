from langchain_core.tools import tool
from database import get_services_with_similarity


@tool
def search_services_by_similarity(
    query: str, threshold: float = 0.1, limit: int = 5
) -> str:
    """
    Search for services using fuzzy matching on titles.

    Args:
        query: The search query (e.g., 'Cấp hộ chiếu phổ thông ở trong nước')
        threshold: Minimum similarity score (default: 0.3)
        limit: Maximum number of results (default: 5)

    Returns:
        Formatted string with matching services and their similarity scores
    """
    try:
        # Use the existing function from database.py
        services = get_services_with_similarity(query, threshold, limit)

        if not services:
            return (
                f"No services found with similarity > {threshold} for query: '{query}'"
            )

        # Format results
        results = []
        for service in services:
            results.append(
                f"Title: {service.title}\n"
                f"Service ID: {service.service_id}\n"
                f"URL: {service.url}\n"
                f"Content: {str(service.content)[:200]}..."
            )
        # print(results)
        return f"Found {len(results)} similar services:\n\n" + "\n\n".join(results)

    except Exception as e:
        return f"Error searching services: {str(e)}"


# print(search_services_by_similarity("Cấp hộ chiếu"))
