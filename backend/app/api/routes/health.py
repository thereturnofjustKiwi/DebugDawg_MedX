from fastapi import APIRouter
from ...models.registry import MODEL_REGISTRY
from ...services import analysis_service

router = APIRouter()


@router.get("/health", summary="Pipeline health check")
async def health():
    loaded = [dt for dt in MODEL_REGISTRY if dt in analysis_service._pipelines]
    return {
        "status": "healthy",
        "pipelines_loaded": loaded,
        "pipelines_total": len(MODEL_REGISTRY),
        "diseases_available": list(MODEL_REGISTRY.keys()),
        "weights_missing": [
            dt for dt in MODEL_REGISTRY
            if dt not in analysis_service._pipelines
        ],
    }
