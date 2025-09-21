"""
Pydantic schemas for OMR Evaluation API
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

class EvaluationMode(str, Enum):
    EASY = "easy"
    MODERATE = "moderate"
    STRICT = "strict"

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class OMRProcessRequest(BaseModel):
    """Request schema for OMR processing"""
    evaluation_mode: EvaluationMode = EvaluationMode.MODERATE
    student_id: Optional[str] = None
    exam_version: Optional[str] = None

class SubjectScores(BaseModel):
    """Subject-wise scores"""
    math: int = Field(ge=0, le=20, description="Math score out of 20")
    ai_ml: int = Field(ge=0, le=20, description="AI/ML score out of 20")
    stats: int = Field(ge=0, le=20, description="Stats score out of 20")
    python: int = Field(ge=0, le=20, description="Python score out of 20")
    genai: int = Field(ge=0, le=20, description="GenAI score out of 20")
    total: int = Field(ge=0, le=100, description="Total score out of 100")
    
    # Add dynamic subject scores
    subject_scores: Optional[Dict[str, int]] = Field(default=None, description="Dynamic subject scores")

class BubbleDetection(BaseModel):
    """Individual bubble detection result"""
    question_number: int = Field(ge=1, le=100)
    bubble_letter: str = Field(pattern="^[A-E]+$")  # Allow multiple letters for multi-marked questions
    is_filled: bool
    fill_percentage: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    coordinates: Dict[str, int] = Field(description="Bubble coordinates (x, y, width, height)")

class ProcessingMetadata(BaseModel):
    """Processing metadata"""
    processing_time_ms: int = Field(ge=0)
    image_width: int = Field(ge=0)
    image_height: int = Field(ge=0)
    bubbles_detected: int = Field(ge=0)
    invalid_questions: List[int] = Field(default_factory=list)
    error_messages: List[str] = Field(default_factory=list)
    evaluation_mode: EvaluationMode
    exam_version: str

class OMRProcessResponse(BaseModel):
    """Response schema for OMR processing"""
    success: bool
    student_id: str
    exam_version: str
    subject_scores: SubjectScores
    invalid_questions: List[int] = Field(default_factory=list)
    bubble_detections: List[BubbleDetection] = Field(default_factory=list)
    processing_metadata: ProcessingMetadata
    result_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    overlay_image_url: Optional[str] = None

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class StudentResult(BaseModel):
    """Student result summary"""
    student_id: str
    total_results: int
    average_score: float
    best_score: int
    latest_result: Optional[OMRProcessResponse] = None

class DatabaseResult(BaseModel):
    """Database result model"""
    id: str
    student_id: str
    exam_version: str
    subject_scores: Dict[str, int]
    total_score: int
    invalid_questions: List[int]
    processing_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None
    overlay_image_path: Optional[str] = None

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    database: str
    omr_processor: str
    timestamp: datetime = Field(default_factory=datetime.now)
