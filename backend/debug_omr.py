#!/usr/bin/env python3
"""
Debug script to test OMR processor
"""

import asyncio
from services.omr_processor import OMRProcessor

async def test_omr_processor():
    """Test the OMR processor"""
    print("Testing OMR Processor...")
    
    # Create processor
    processor = OMRProcessor()
    print(f"OMR Core initialized: {processor.omr_core is not None}")
    
    if processor.omr_core:
        print(f"Template loaded: {processor.omr_core.template is not None}")
        print(f"Evaluator setup: {processor.omr_core.evaluator is not None}")
    
    # Test with sample data
    test_subjects = [{"name": "Math", "questions": 4, "answer_key": ["A", "B", "C", "D"]}]
    answer_key = ["A", "B", "C", "D"]
    
    # Create a simple test image
    import cv2
    import numpy as np
    test_image = np.ones((400, 300, 3), dtype=np.uint8) * 255  # White background
    
    # Add some simple "bubbles" (dark circles)
    cv2.circle(test_image, (50, 100), 15, 0, -1)  # Filled circle
    cv2.circle(test_image, (100, 100), 15, 0, -1)  # Filled circle
    cv2.circle(test_image, (150, 100), 15, 0, -1)  # Filled circle
    cv2.circle(test_image, (200, 100), 15, 0, -1)  # Filled circle
    
    # Convert to bytes
    _, buffer = cv2.imencode('.png', test_image)
    file_content = buffer.tobytes()
    
    # Test process_sheet
    print("Testing process_sheet...")
    result = await processor.process_sheet(
        file_content=file_content,
        filename="test.png",
        evaluation_mode="moderate",
        student_id="test123",
        test_subjects=test_subjects,
        test_answer_key=answer_key
    )
    
    print(f"Result success: {result.success}")
    print(f"Subject scores: {result.subject_scores}")
    if hasattr(result.subject_scores, 'subject_scores'):
        print(f"Dynamic subject scores: {result.subject_scores.subject_scores}")

if __name__ == "__main__":
    asyncio.run(test_omr_processor())
