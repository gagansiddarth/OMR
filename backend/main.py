"""
FastAPI Backend for Automated OMR Evaluation System
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import List, Optional
import logging

from services.omr_processor import OMRProcessor
from services.database import DatabaseService
from models.schemas import OMRProcessRequest, OMRProcessResponse, ErrorResponse
from config.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="OMR Evaluation API",
    description="Automated OMR sheet processing and evaluation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://localhost:8084", "http://localhost:8088", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
settings = get_settings()
omr_processor = OMRProcessor()
db_service = DatabaseService()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "OMR Evaluation API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check database connection
        db_status = await db_service.health_check()
        return {
            "status": "healthy",
            "database": db_status,
            "omr_processor": "ready"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.post("/process-omr", response_model=OMRProcessResponse)
async def process_omr(
    file: UploadFile = File(...),
    evaluation_mode: str = "moderate",
    student_id: Optional[str] = None,
    test_data: Optional[str] = None  # JSON string containing test subjects and answer key
):
    """
    Process uploaded OMR sheet image
    
    Args:
        file: OMR sheet image (JPG/PNG/PDF)
        evaluation_mode: Evaluation mode (easy/moderate/strict)
        student_id: Optional student ID for identification
        test_data: JSON string containing test subjects and answer key
    
    Returns:
        OMRProcessResponse with processing results
    """
    try:
        logger.info(f"Processing OMR sheet: {file.filename}, mode: {evaluation_mode}")
        
        # Validate file type
        if not file.content_type.startswith(('image/', 'application/pdf')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only images and PDFs are supported."
            )
        
        # Validate evaluation mode
        if evaluation_mode not in ['easy', 'moderate', 'strict']:
            raise HTTPException(
                status_code=400,
                detail="Invalid evaluation mode. Must be 'easy', 'moderate', or 'strict'."
            )
        
        # Parse test data if provided
        test_subjects = None
        test_answer_key = None
        if test_data:
            try:
                import json
                test_info = json.loads(test_data)
                test_subjects = test_info.get('subjects', [])
                test_answer_key = test_info.get('answerKey', [])
                logger.info(f"Using test-specific data: {len(test_subjects)} subjects, {len(test_answer_key)} questions")
                logger.info(f"Test subjects: {test_subjects}")
                logger.info(f"Test answer key: {test_answer_key}")
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid test_data JSON: {e}, using default answer key")
        else:
            logger.info("No test_data provided, using default answer key")
        
        # Read file content
        file_content = await file.read()
        
        # Process OMR sheet with test data
        logger.info(f"Calling process_sheet with test_subjects: {test_subjects}, test_answer_key: {test_answer_key}")
        result = await omr_processor.process_sheet(
            file_content=file_content,
            filename=file.filename,
            evaluation_mode=evaluation_mode,
            student_id=student_id,
            test_subjects=test_subjects,
            test_answer_key=test_answer_key
        )
        logger.info(f"Process sheet result: success={result.success}, subject_scores={result.subject_scores}")
        
        # Store results in database
        await db_service.save_omr_result(result)
        
        logger.info(f"Successfully processed OMR sheet: {file.filename}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing OMR sheet {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/results/{student_id}")
async def get_student_results(student_id: str):
    """Get all results for a specific student"""
    try:
        results = await db_service.get_student_results(student_id)
        return {"student_id": student_id, "results": results}
    except Exception as e:
        logger.error(f"Error fetching results for student {student_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/results")
async def get_all_results(limit: int = 100, offset: int = 0):
    """Get all OMR results with pagination"""
    try:
        results = await db_service.get_all_results(limit=limit, offset=offset)
        return {"results": results, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error fetching results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/results/{result_id}")
async def delete_result(result_id: str):
    """Delete a specific OMR result"""
    try:
        await db_service.delete_result(result_id)
        return {"message": "Result deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting result {result_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
