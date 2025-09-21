#!/usr/bin/env python3
"""
Test script to check OMR processor initialization
"""

from services.omr_processor import OMRProcessor

def test_processor_init():
    """Test OMR processor initialization"""
    print("Testing OMR Processor Initialization...")
    
    # Create processor
    processor = OMRProcessor()
    print(f"OMR Core initialized: {processor.omr_core is not None}")
    
    if processor.omr_core:
        print(f"Template loaded: {processor.omr_core.template is not None}")
        print(f"Evaluator setup: {processor.omr_core.evaluator is not None}")
        
        # Test template creation
        test_subjects = [{"name": "Math", "questions": 4, "answer_key": ["A", "B", "C", "D"]}]
        answer_key = ["A", "B", "C", "D"]
        
        print("Testing template creation...")
        template_created = processor.omr_core.create_template_from_test_data(test_subjects, answer_key)
        print(f"Template created: {template_created}")
        
        if template_created:
            print("Testing evaluator setup...")
            processor.omr_core.setup_evaluator(test_subjects, answer_key)
            print(f"Evaluator setup: {processor.omr_core.evaluator is not None}")
    else:
        print("ERROR: OMR Core not initialized!")

if __name__ == "__main__":
    test_processor_init()
