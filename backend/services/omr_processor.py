"""
Core OMR Processing Service
Implements the complete OMR evaluation pipeline using the comprehensive OMR core system
"""

import cv2
import numpy as np
import json
import time
import os
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image
import pytesseract
from io import BytesIO

from models.schemas import (
    OMRProcessResponse, SubjectScores, BubbleDetection, 
    ProcessingMetadata, EvaluationMode
)
from config.settings import get_settings
from omr_core import OMRCore, create_omr_core

class OMRProcessor:
    """Main OMR processing service using comprehensive OMR core system"""
    
    def __init__(self):
        self.settings = get_settings()
        self.omr_core = None
        self._initialize_omr_core()
        
    def _initialize_omr_core(self):
        """Initialize the OMR core system"""
        try:
            # Create comprehensive configuration
            config = {
                "tuning": {
                    "dimensions": {
                        "display_height": 2480,
                        "display_width": 1640,
                        "processing_height": 820,
                        "processing_width": 666
                    },
                    "threshold_params": {
                        "GAMMA_LOW": 0.7,
                        "MIN_GAP": 30,
                        "MIN_JUMP": 25,
                        "CONFIDENT_SURPLUS": 5,
                        "JUMP_DELTA": 30,
                        "PAGE_TYPE_FOR_THRESHOLD": "white"
                    },
                    "alignment_params": {
                        "auto_align": False,
                        "match_col": 5,
                        "max_steps": 20,
                        "stride": 1,
                        "thickness": 3
                    },
                    "outputs": {
                        "show_image_level": 0,
                        "save_image_level": 0,
                        "save_detections": True,
                        "filter_out_multimarked_files": False
                    }
                }
            }
            
            self.omr_core = create_omr_core(config)
            print("OMR Core system initialized successfully")
            
        except Exception as e:
            print(f"Error initializing OMR core: {e}")
            self.omr_core = None
    
    async def process_sheet(
        self, 
        file_content: bytes, 
        filename: str, 
        evaluation_mode: str = "moderate",
        student_id: Optional[str] = None,
        test_subjects: Optional[List[Dict]] = None,
        test_answer_key: Optional[List[str]] = None
    ) -> OMRProcessResponse:
        print(f"Processing OMR sheet: {filename}, size: {len(file_content)} bytes, mode: {evaluation_mode}, student: {student_id}")
        """
        Main OMR processing pipeline using comprehensive OMR core system
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            evaluation_mode: Evaluation mode (easy/moderate/strict)
            student_id: Optional student ID
            test_subjects: Test subjects configuration
            test_answer_key: Answer key for evaluation
            
        Returns:
            OMRProcessResponse with processing results
        """
        start_time = time.time()
        
        try:
            print(f"Starting process_sheet with test_subjects: {test_subjects}")
            print(f"OMR Core available: {self.omr_core is not None}")
            
            if not self.omr_core:
                raise Exception("OMR core system not initialized")
            
            # Convert bytes to image
            image = Image.open(BytesIO(file_content))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Setup template and evaluator from test data
            if test_subjects and test_answer_key:
                print(f"Setting up template and evaluator from test data: {len(test_subjects)} subjects, {len(test_answer_key)} questions")
                
                # Create template from test data
                template_created = self.omr_core.create_template_from_test_data(test_subjects, test_answer_key)
                if not template_created:
                    raise Exception("Failed to create template from test data")
                
                # Setup evaluator
                self.omr_core.setup_evaluator(test_subjects, test_answer_key)
            else:
                # Use default template if available
                template_path = "templates/default_template.json"
                if not self.omr_core.load_template(template_path):
                    # Create a basic template
                    self.omr_core.create_template_from_test_data(
                        [{"name": "Default", "questions": 20, "answer_key": ["A"] * 20}],
                        ["A"] * 20
                    )
                    self.omr_core.setup_evaluator()
            
            # Process OMR image using comprehensive system
            print("Processing OMR image with comprehensive system...")
            print(f"OMR Core initialized: {self.omr_core is not None}")
            print(f"Template loaded: {self.omr_core.template is not None if self.omr_core else False}")
            print(f"Evaluator setup: {self.omr_core.evaluator is not None if self.omr_core else False}")
            
            try:
                results = self.omr_core.process_omr_image(cv_image, filename)
                print(f"Comprehensive system results: {results}")
                
                if not results["success"]:
                    raise Exception(f"OMR processing failed: {results.get('error', 'Unknown error')}")
            except Exception as e:
                print(f"Comprehensive system failed: {e}")
                # Fall back to old system
                print("Falling back to old OMR system...")
                raise Exception(f"Comprehensive OMR system failed: {e}")
            
            # Extract results
            omr_response = results["omr_response"]
            scoring_report = results["scoring_report"]
            processing_time = int(results["processing_time_ms"])
            
            print(f"OMR Response: {omr_response}")
            print(f"Scoring Report: {scoring_report}")
            print(f"Test Subjects: {test_subjects}")
            
            # Convert to legacy format for compatibility
            bubble_detections = self._convert_to_bubble_detections(omr_response)
            subject_scores = self._convert_to_subject_scores(scoring_report, test_subjects)
            invalid_questions = self._extract_invalid_questions(results["detection_metadata"])
            
            print(f"Converted Subject Scores: {subject_scores}")
            
            # Generate overlay image
            overlay_url = await self._generate_overlay_image(
                cv_image, bubble_detections, filename, results.get("visualization")
            )
            
            # Create response
            response = OMRProcessResponse(
                success=True,
                student_id=student_id or self._extract_student_id(filename),
                exam_version="A",  # Default version
                subject_scores=subject_scores,
                invalid_questions=invalid_questions,
                bubble_detections=bubble_detections,
                processing_metadata=ProcessingMetadata(
                    processing_time_ms=processing_time,
                    image_width=cv_image.shape[1],
                    image_height=cv_image.shape[0],
                    bubbles_detected=len(bubble_detections),
                    invalid_questions=invalid_questions,
                    error_messages=[],
                    evaluation_mode=EvaluationMode(evaluation_mode),
                    exam_version="A"
                ),
                overlay_image_url=overlay_url
            )
            
            print(f"OMR processing completed successfully: {scoring_report.total_score:.2f}/{scoring_report.max_possible_score:.2f} ({scoring_report.percentage:.2f}%)")
            return response
            
        except Exception as e:
            print(f"Error in process_sheet: {e}")
            # Return error response
            return OMRProcessResponse(
                success=False,
                student_id=student_id or "unknown",
                exam_version="unknown",
                subject_scores=SubjectScores(
                    math=0, ai_ml=0, stats=0, python=0, genai=0, total=0
                ),
                processing_metadata=ProcessingMetadata(
                    processing_time_ms=int((time.time() - start_time) * 1000),
                    image_width=0,
                    image_height=0,
                    bubbles_detected=0,
                    invalid_questions=[],
                    error_messages=[str(e)],
                    evaluation_mode=EvaluationMode(evaluation_mode),
                    exam_version="unknown"
                )
            )
    
    def _convert_to_bubble_detections(self, omr_response: Dict[str, str]) -> List[BubbleDetection]:
        """Convert OMR response to legacy bubble detection format"""
        detections = []
        question_num = 1
        
        for question, answer in omr_response.items():
            if answer and answer != "":
                # Create bubble detection for the selected answer
                detection = BubbleDetection(
                    question_number=question_num,
                    bubble_letter=answer,
                    is_filled=True,
                    fill_percentage=0.8,  # Default confidence
                    confidence=0.8,
                    coordinates={
                        'x': 0, 'y': 0, 'width': 20, 'height': 20
                    }
                )
                detections.append(detection)
            
            question_num += 1
        
        return detections
    
    def _convert_to_subject_scores(self, scoring_report, test_subjects: Optional[List[Dict]] = None) -> SubjectScores:
        """Convert scoring report to legacy subject scores format"""
        if test_subjects:
            # Use test-specific subjects
            subject_scores = {}
            total_questions = len(scoring_report.evaluation_results)
            
            current_question = 1
            for i, subject in enumerate(test_subjects):
                subject_name = subject.get("name", f"Subject_{i+1}")
                subject_questions = subject.get("questions", 0)
                
                # Calculate score for this subject
                subject_score = 0
                for j in range(current_question, current_question + subject_questions):
                    if j <= len(scoring_report.evaluation_results):
                        result = scoring_report.evaluation_results[j-1]
                        if result.verdict == "correct":
                            subject_score += 1
                
                subject_scores[subject_name] = subject_score
                current_question += subject_questions
            
            # For backward compatibility, also include the legacy format
            subjects_list = list(subject_scores.keys())
            
            # Create the dynamic subject scores dictionary
            dynamic_scores = {
                "Total": scoring_report.total_score
            }
            dynamic_scores.update(subject_scores)
            
            return SubjectScores(
                math=subject_scores.get(subjects_list[0] if len(subjects_list) > 0 else "Math", 0),
                ai_ml=subject_scores.get(subjects_list[1] if len(subjects_list) > 1 else "AI/ML", 0),
                stats=subject_scores.get(subjects_list[2] if len(subjects_list) > 2 else "Stats", 0),
                python=subject_scores.get(subjects_list[3] if len(subjects_list) > 3 else "Python", 0),
                genai=subject_scores.get(subjects_list[4] if len(subjects_list) > 4 else "GenAI", 0),
                total=scoring_report.total_score,
                subject_scores=dynamic_scores
            )
        else:
            # Use default subject mapping
            return SubjectScores(
                math=scoring_report.total_score * 0.2,
                ai_ml=scoring_report.total_score * 0.2,
                stats=scoring_report.total_score * 0.2,
                python=scoring_report.total_score * 0.2,
                genai=scoring_report.total_score * 0.2,
                total=scoring_report.total_score
            )
    
    def _extract_invalid_questions(self, detection_metadata: Dict[str, Any]) -> List[int]:
        """Extract invalid questions from detection metadata"""
        invalid_questions = []
        
        # Add multi-marked questions
        multi_marked = detection_metadata.get("multi_marked", [])
        for question in multi_marked:
            # Extract question number from field label (e.g., "q1" -> 1)
            if question.startswith("q"):
                try:
                    q_num = int(question[1:])
                    invalid_questions.append(q_num)
                except ValueError:
                    pass
        
        return invalid_questions
    
    async def _generate_overlay_image(self, original_image: np.ndarray, detections: List[BubbleDetection], 
                                    filename: str, visualization: np.ndarray = None) -> str:
        """Generate overlay image with detected bubbles marked"""
        try:
            if visualization is not None:
                # Use the visualization from the comprehensive system
                overlay = visualization
            else:
                # Create basic overlay
                overlay = original_image.copy()
                
                # Draw detected bubbles
                for detection in detections:
                    coords = detection.coordinates
                    color = (0, 255, 0) if detection.is_filled else (0, 0, 255)
                    thickness = 3 if detection.is_filled else 1
                    
                    cv2.rectangle(
                        overlay,
                        (coords['x'], coords['y']),
                        (coords['x'] + coords['width'], coords['y'] + coords['height']),
                        color,
                        thickness
                    )
            
            # Save overlay image
            timestamp = int(time.time())
            overlay_filename = f"overlay_{timestamp}_{filename}"
            overlay_path = os.path.join(self.settings.output_dir, overlay_filename)
            
            cv2.imwrite(overlay_path, overlay)
            
            return f"/outputs/{overlay_filename}"
            
        except Exception as e:
            print(f"Error generating overlay image: {e}")
            return None
    
    def _extract_student_id(self, filename: str) -> str:
        """Extract student ID from filename"""
        # Try to extract student ID from filename
        import re
        match = re.search(r'(\d+)', filename)
        return match.group(1) if match else f"student_{int(time.time())}"
