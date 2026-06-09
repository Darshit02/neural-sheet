from fastapi import APIRouter
from app.api.routes import (
    auth, users, datasets, analysis, ai,
    visualizations, projects, providers,
    activity, cleaning, pipeline_templates, pipeline,
)

api_router = APIRouter()

api_router.include_router(auth.router,               prefix="/auth",               tags=["Auth"])
api_router.include_router(users.router,              prefix="/users",              tags=["Users"])
api_router.include_router(projects.router,           prefix="/projects",           tags=["Projects"])
api_router.include_router(providers.router,          prefix="/providers",          tags=["Providers"])
api_router.include_router(datasets.router,           prefix="/datasets",           tags=["Datasets"])
api_router.include_router(cleaning.router,           prefix="/datasets/clean",     tags=["Cleaning"])
api_router.include_router(pipeline.router,           prefix="/pipeline",           tags=["Pipeline"])
api_router.include_router(pipeline_templates.router, prefix="/pipeline-templates", tags=["Templates"])
api_router.include_router(analysis.router,           prefix="/analysis",           tags=["Analysis"])
api_router.include_router(ai.router,                 prefix="/ai",                 tags=["AI"])
api_router.include_router(visualizations.router,     prefix="/visualizations",     tags=["Viz"])
api_router.include_router(activity.router,           prefix="/me",                 tags=["Activity"])
