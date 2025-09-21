#!/usr/bin/env python3
"""
Test script for the comprehensive OMR core system
"""

import cv2
import numpy as np
from omr_core import create_omr_core

def test_omr_core():
    """Test the OMR core system"""
    print("Testing OMR Core System...")
    
    # Create OMR core
    config = {
        "tuning": {
            "dimensions": {
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
            "outputs": {
                "save_image_level": 0
            }
        }
    }
    
    omr_core = create_omr_core(config)
    print(f"OMR Core created: {omr_core is not None}")
    
    # Test with test data
    test_subjects = [{"name": "Math", "questions": 4, "answer_key": ["A", "B", "C", "D"]}]
    answer_key = ["A", "B", "C", "D"]
    
    # Create template from test data
    print("Creating template from test data...")
    template_created = omr_core.create_template_from_test_data(test_subjects, answer_key)
    print(f"Template created: {template_created}")
    
    # Setup evaluator
    print("Setting up evaluator...")
    omr_core.setup_evaluator(test_subjects, answer_key)
    print(f"Evaluator setup: {omr_core.evaluator is not None}")
    
    # Create a simple test image
    print("Creating test image...")
    test_image = np.ones((400, 300, 3), dtype=np.uint8) * 255  # White background
    
    # Add some simple "bubbles" (dark circles)
    cv2.circle(test_image, (50, 100), 15, 0, -1)  # Filled circle
    cv2.circle(test_image, (100, 100), 15, 0, -1)  # Filled circle
    cv2.circle(test_image, (150, 100), 15, 0, -1)  # Filled circle
    cv2.circle(test_image, (200, 100), 15, 0, -1)  # Filled circle
    
    # Process the image
    print("Processing test image...")
    results = omr_core.process_omr_image(test_image, "test_image.png")
    
    print(f"Results: {results}")
    print(f"Success: {results.get('success', False)}")
    print(f"OMR Response: {results.get('omr_response', {})}")
    
    if results.get('scoring_report'):
        scoring_report = results['scoring_report']
        print(f"Total Score: {scoring_report.total_score}")
        print(f"Percentage: {scoring_report.percentage:.2f}%")
        print(f"Correct Answers: {scoring_report.correct_answers}")
        print(f"Incorrect Answers: {scoring_report.incorrect_answers}")

if __name__ == "__main__":
    test_omr_core()
