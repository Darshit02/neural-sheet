from fastapi import APIRouter
from app.api.routes import auth, users, datasets, analysis, ai, visualizations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["Datasets"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(visualizations.router, prefix="/visualizations", tags=["Visualizations"])
