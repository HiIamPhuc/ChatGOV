from fastapi import APIRouter, Response
from IPython.display import Image
from ..graph import compile_graph

router = APIRouter()


@router.get('/api/graph/')
async def visualize_graph():
    graph = compile_graph()
    img_data = graph.get_graph().draw_mermaid_png()

    return Response(content=img_data, media_type="image/png")
