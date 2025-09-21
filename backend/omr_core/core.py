"""
Main OMR Processing Core
Integrates template system, image processing, bubble detection, and evaluation
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import json
import time

from .template import Template, FieldBlock
from .processors import ImageProcessorFactory, ImageInstanceOps
from .bubble_detection import BubbleDetector
from .evaluation import OMREvaluator, EvaluationConfig, ScoringReport


class OMRCore:
    """Main OMR processing system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.tuning_config = config.get("tuning", {})
        self.template = None
        self.image_processor = ImageInstanceOps(self.tuning_config)
        self.bubble_detector = BubbleDetector(self.tuning_config)
        self.evaluator = None
        
        # Initialize default configuration
        self._setup_default_config()
    
    def _setup_default_config(self):
        """Setup default configuration if not provided"""
        if "tuning" not in self.config:
            self.config["tuning"] = {
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
    
    def load_template(self, template_path: str) -> bool:
        """Load OMR template from file"""
        try:
            self.template = Template(template_path, self.tuning_config)
            
            if not self.template.validate_template():
                print("Warning: Template validation failed")
                return False
            
            print(f"Template loaded successfully: {template_path}")
            print(f"Page dimensions: {self.template.page_dimensions}")
            print(f"Field blocks: {len(self.template.field_blocks)}")
            
            return True
            
        except Exception as e:
            print(f"Error loading template: {e}")
            return False
    
    def create_template_from_test_data(self, test_subjects: List[Dict], answer_key: List[str], 
                                     template_path: str = None) -> bool:
        """Create template from test data"""
        try:
            if not template_path:
                template_path = "templates/generated_template.json"
            
            # Create template configuration
            template_config = {
                "pageDimensions": [666, 820],
                "bubbleDimensions": [20, 20],
                "emptyValue": "",
                "fieldBlocks": {},
                "preProcessors": [
                    {
                        "name": "CropPage",
                        "options": {"morphKernel": [10, 10]}
                    }
                ]
            }
            
            # Calculate total questions
            total_questions = sum(subject.get("questions", 0) for subject in test_subjects)
            
            # Create field blocks for each subject
            current_question = 1
            for i, subject in enumerate(test_subjects):
                subject_name = subject.get("name", f"Subject_{i+1}")
                subject_questions = subject.get("questions", 0)
                
                if subject_questions > 0:
                    # Calculate origin position (stacked vertically)
                    origin_y = 100 + (i * subject_questions * 60)
                    
                    template_config["fieldBlocks"][subject_name] = {
                        "fieldType": "QTYPE_MCQ4",
                        "origin": [50, origin_y],
                        "bubblesGap": 50,
                        "labelsGap": 60,
                        "fieldLabels": [f"q{j}" for j in range(current_question, current_question + subject_questions)]
                    }
                    
                    current_question += subject_questions
            
            # Save template
            Path(template_path).parent.mkdir(parents=True, exist_ok=True)
            with open(template_path, 'w') as f:
                json.dump(template_config, f, indent=2)
            
            # Load the created template
            return self.load_template(template_path)
            
        except Exception as e:
            print(f"Error creating template from test data: {e}")
            return False
    
    def setup_evaluator(self, test_subjects: List[Dict] = None, answer_key: List[str] = None):
        """Setup evaluator with test data"""
        try:
            if test_subjects and answer_key:
                evaluation_config = EvaluationConfig.create_from_test_data(test_subjects, answer_key)
            else:
                evaluation_config = EvaluationConfig.create_default_config()
            
            self.evaluator = OMREvaluator(evaluation_config)
            print("Evaluator setup successfully")
            
        except Exception as e:
            print(f"Error setting up evaluator: {e}")
    
    def process_omr_image(self, image: np.ndarray, file_path: str = None) -> Dict[str, Any]:
        """Process OMR image and return results"""
        try:
            if not self.template:
                raise ValueError("No template loaded")
            
            if not self.evaluator:
                raise ValueError("No evaluator setup")
            
            start_time = time.time()
            
            # Step 1: Image preprocessing
            print("Step 1: Image preprocessing...")
            preprocessors = ImageProcessorFactory.create_processors_from_config(
                self.template.preprocessors_config
            )
            processed_image = self.image_processor.apply_preprocessors(
                file_path or "unknown", image, preprocessors
            )
            
            # Step 2: Bubble detection
            print("Step 2: Bubble detection...")
            detection_results = self.bubble_detector.detect_bubbles(
                processed_image, self.template, file_path
            )
            
            # Step 3: Answer evaluation
            print("Step 3: Answer evaluation...")
            scoring_report = self.evaluator.evaluate_omr_response(
                detection_results["omr_response"], file_path
            )
            
            # Step 4: Generate visualization
            print("Step 4: Generating visualization...")
            visualization = self.bubble_detector.visualize_detection(
                processed_image, self.template, detection_results
            )
            
            processing_time = (time.time() - start_time) * 1000
            
            # Compile results
            results = {
                "success": True,
                "processing_time_ms": processing_time,
                "omr_response": detection_results["omr_response"],
                "scoring_report": scoring_report,
                "detection_metadata": {
                    "global_threshold": detection_results["global_threshold"],
                    "final_marked": detection_results["final_marked"],
                    "multi_marked": detection_results["multi_marked"],
                    "multi_roll": detection_results["multi_roll"]
                },
                "visualization": visualization,
                "template_info": {
                    "page_dimensions": self.template.page_dimensions,
                    "bubble_dimensions": self.template.bubble_dimensions,
                    "field_blocks": len(self.template.field_blocks)
                }
            }
            
            print(f"OMR processing completed in {processing_time:.2f}ms")
            print(f"Score: {scoring_report.total_score:.2f}/{scoring_report.max_possible_score:.2f} ({scoring_report.percentage:.2f}%)")
            
            return results
            
        except Exception as e:
            print(f"Error processing OMR image: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": 0,
                "omr_response": {},
                "scoring_report": None
            }
    
    def process_omr_file(self, file_path: str) -> Dict[str, Any]:
        """Process OMR file from disk"""
        try:
            # Load image
            image = cv2.imread(file_path)
            if image is None:
                raise ValueError(f"Could not load image: {file_path}")
            
            return self.process_omr_image(image, file_path)
            
        except Exception as e:
            print(f"Error processing OMR file: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": 0,
                "omr_response": {},
                "scoring_report": None
            }
    
    def batch_process(self, input_dir: str, output_dir: str = None) -> List[Dict[str, Any]]:
        """Process multiple OMR files in batch"""
        try:
            input_path = Path(input_dir)
            if not input_path.exists():
                raise ValueError(f"Input directory does not exist: {input_dir}")
            
            # Find OMR images
            image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
            omr_files = []
            for ext in image_extensions:
                omr_files.extend(input_path.glob(f"*{ext}"))
                omr_files.extend(input_path.glob(f"*{ext.upper()}"))
            
            if not omr_files:
                print(f"No OMR images found in {input_dir}")
                return []
            
            print(f"Found {len(omr_files)} OMR images to process")
            
            # Process each file
            results = []
            for file_path in omr_files:
                print(f"Processing: {file_path.name}")
                result = self.process_omr_file(str(file_path))
                results.append({
                    "file_path": str(file_path),
                    "file_name": file_path.name,
                    **result
                })
                
                # Save visualization if output directory specified
                if output_dir and result.get("success") and result.get("visualization") is not None:
                    output_path = Path(output_dir)
                    output_path.mkdir(parents=True, exist_ok=True)
                    vis_path = output_path / f"vis_{file_path.name}"
                    cv2.imwrite(str(vis_path), result["visualization"])
            
            return results
            
        except Exception as e:
            print(f"Error in batch processing: {e}")
            return []
    
    def get_template_info(self) -> Dict[str, Any]:
        """Get information about loaded template"""
        if not self.template:
            return {"error": "No template loaded"}
        
        return {
            "page_dimensions": self.template.page_dimensions,
            "bubble_dimensions": self.template.bubble_dimensions,
            "field_blocks": [
                {
                    "name": block.name,
                    "field_type": block.field_type,
                    "origin": block.origin,
                    "questions": len(block.field_labels)
                }
                for block in self.template.field_blocks
            ],
            "total_questions": sum(len(block.field_labels) for block in self.template.field_blocks)
        }
    
    def save_results_csv(self, results: List[Dict[str, Any]], output_path: str):
        """Save batch processing results to CSV"""
        try:
            import csv
            
            with open(output_path, 'w', newline='') as f:
                writer = csv.writer(f)
                
                # Write header
                writer.writerow([
                    'file_name', 'success', 'total_score', 'percentage', 
                    'correct_answers', 'incorrect_answers', 'unmarked_answers',
                    'processing_time_ms'
                ])
                
                # Write results
                for result in results:
                    scoring_report = result.get("scoring_report")
                    if scoring_report:
                        writer.writerow([
                            result.get("file_name", ""),
                            result.get("success", False),
                            scoring_report.total_score,
                            scoring_report.percentage,
                            scoring_report.correct_answers,
                            scoring_report.incorrect_answers,
                            scoring_report.unmarked_answers,
                            result.get("processing_time_ms", 0)
                        ])
            
            print(f"Results saved to: {output_path}")
            
        except Exception as e:
            print(f"Error saving results CSV: {e}")


def create_omr_core(config: Dict[str, Any] = None) -> OMRCore:
    """Factory function to create OMR core instance"""
    if config is None:
        config = {}
    
    return OMRCore(config)
