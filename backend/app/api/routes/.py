from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def _root():
    return {"route": "", "status": "ok"}
