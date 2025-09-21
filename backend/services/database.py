"""
Database service for OMR Evaluation Backend
Handles all database operations using SQLAlchemy
"""

import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import JSON
import json
import logging

from models.schemas import OMRProcessResponse, DatabaseResult
from config.settings import get_settings

logger = logging.getLogger(__name__)

# Database setup
Base = declarative_base()

class OMRResult(Base):
    """Database model for OMR results"""
    __tablename__ = "omr_results"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, index=True, nullable=False)
    exam_version = Column(String, nullable=False)
    subject_scores = Column(JSON, nullable=False)
    total_score = Column(Integer, nullable=False)
    invalid_questions = Column(JSON, default=list)
    processing_metadata = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    overlay_image_path = Column(String, nullable=True)

class DatabaseService:
    """Database service for OMR evaluation"""
    
    def __init__(self):
        self.settings = get_settings()
        self.engine = None
        self.SessionLocal = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize database connection and create tables"""
        try:
            # Create database URL
            database_url = self.settings.database_url
            
            # Create engine
            self.engine = create_engine(database_url, echo=self.settings.debug)
            
            # Create session factory
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            
            # Create tables
            Base.metadata.create_all(bind=self.engine)
            
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    async def health_check(self) -> str:
        """Check database connection health"""
        try:
            with self.SessionLocal() as session:
                # Simple query to test connection
                session.execute(text("SELECT 1"))
                return "connected"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return f"error: {e}"
    
    async def save_omr_result(self, result: OMRProcessResponse) -> str:
        """Save OMR processing result to database"""
        try:
            with self.SessionLocal() as session:
                # Generate unique ID
                result_id = f"omr_{int(datetime.utcnow().timestamp())}_{result.student_id}"
                
                # Convert subject scores to dict
                subject_scores_dict = {
                    "math": result.subject_scores.math,
                    "ai_ml": result.subject_scores.ai_ml,
                    "stats": result.subject_scores.stats,
                    "python": result.subject_scores.python,
                    "genai": result.subject_scores.genai,
                    "total": result.subject_scores.total
                }
                
                # Convert processing metadata to dict
                metadata_dict = {
                    "processing_time_ms": result.processing_metadata.processing_time_ms,
                    "image_width": result.processing_metadata.image_width,
                    "image_height": result.processing_metadata.image_height,
                    "bubbles_detected": result.processing_metadata.bubbles_detected,
                    "invalid_questions": result.processing_metadata.invalid_questions,
                    "error_messages": result.processing_metadata.error_messages,
                    "evaluation_mode": result.processing_metadata.evaluation_mode.value,
                    "exam_version": result.processing_metadata.exam_version
                }
                
                # Create database record
                db_result = OMRResult(
                    id=result_id,
                    student_id=result.student_id,
                    exam_version=result.exam_version,
                    subject_scores=subject_scores_dict,
                    total_score=result.subject_scores.total,
                    invalid_questions=result.invalid_questions,
                    processing_metadata=metadata_dict,
                    overlay_image_path=result.overlay_image_url
                )
                
                session.add(db_result)
                session.commit()
                
                logger.info(f"Saved OMR result: {result_id}")
                return result_id
                
        except Exception as e:
            logger.error(f"Failed to save OMR result: {e}")
            raise
    
    async def get_student_results(self, student_id: str) -> List[Dict[str, Any]]:
        """Get all results for a specific student"""
        try:
            with self.SessionLocal() as session:
                results = session.query(OMRResult).filter(
                    OMRResult.student_id == student_id
                ).order_by(OMRResult.created_at.desc()).all()
                
                return [self._convert_to_dict(result) for result in results]
                
        except Exception as e:
            logger.error(f"Failed to get student results: {e}")
            raise
    
    async def get_all_results(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all OMR results with pagination"""
        try:
            with self.SessionLocal() as session:
                results = session.query(OMRResult).order_by(
                    OMRResult.created_at.desc()
                ).offset(offset).limit(limit).all()
                
                return [self._convert_to_dict(result) for result in results]
                
        except Exception as e:
            logger.error(f"Failed to get all results: {e}")
            raise
    
    async def get_result_by_id(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Get specific result by ID"""
        try:
            with self.SessionLocal() as session:
                result = session.query(OMRResult).filter(
                    OMRResult.id == result_id
                ).first()
                
                return self._convert_to_dict(result) if result else None
                
        except Exception as e:
            logger.error(f"Failed to get result by ID: {e}")
            raise
    
    async def delete_result(self, result_id: str) -> bool:
        """Delete result by ID"""
        try:
            with self.SessionLocal() as session:
                result = session.query(OMRResult).filter(
                    OMRResult.id == result_id
                ).first()
                
                if result:
                    session.delete(result)
                    session.commit()
                    logger.info(f"Deleted result: {result_id}")
                    return True
                else:
                    logger.warning(f"Result not found: {result_id}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to delete result: {e}")
            raise
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics"""
        try:
            with self.SessionLocal() as session:
                # Total results
                total_results = session.query(OMRResult).count()
                
                # Average score
                avg_score = session.query(
                    session.query(OMRResult.total_score).label('avg')
                ).scalar()
                
                # Results by exam version
                version_counts = {}
                for version in ['A', 'B', 'C', 'D']:
                    count = session.query(OMRResult).filter(
                        OMRResult.exam_version == version
                    ).count()
                    version_counts[version] = count
                
                # Recent results (last 24 hours)
                from datetime import timedelta
                recent_cutoff = datetime.utcnow() - timedelta(hours=24)
                recent_results = session.query(OMRResult).filter(
                    OMRResult.created_at >= recent_cutoff
                ).count()
                
                return {
                    "total_results": total_results,
                    "average_score": float(avg_score) if avg_score else 0,
                    "results_by_version": version_counts,
                    "recent_results_24h": recent_results
                }
                
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            raise
    
    def _convert_to_dict(self, result: OMRResult) -> Dict[str, Any]:
        """Convert database result to dictionary"""
        return {
            "id": result.id,
            "student_id": result.student_id,
            "exam_version": result.exam_version,
            "subject_scores": result.subject_scores,
            "total_score": result.total_score,
            "invalid_questions": result.invalid_questions,
            "processing_metadata": result.processing_metadata,
            "created_at": result.created_at.isoformat(),
            "updated_at": result.updated_at.isoformat() if result.updated_at else None,
            "overlay_image_path": result.overlay_image_path
        }
