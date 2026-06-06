from app.workers.celery_app import celery
from loguru import logger


@celery.task(bind=True, name="process_dataset")
def process_dataset(self, dataset_id: int, file_path: str):
    logger.info(f"Processing dataset {dataset_id}")
    # Will be implemented in Step 6
    return {"status": "processed", "dataset_id": dataset_id}


@celery.task(bind=True, name="generate_analysis")
def generate_analysis(self, dataset_id: int, user_id: int):
    logger.info(f"Generating analysis for dataset {dataset_id}")
    # Will be implemented in Step 7
    return {"status": "analysed", "dataset_id": dataset_id}
