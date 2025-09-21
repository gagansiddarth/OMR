#!/usr/bin/env python3
"""
Test script to check API response structure
"""

import asyncio
import json
from services.omr_processor import OMRProcessor
from models.schemas import SubjectScores

async def test_api_response():
    """Test the API response structure"""
    print("Testing API Response Structure...")
    
    # Create a SubjectScores object with dynamic subject scores
    subject_scores = SubjectScores(
        math=5,
        ai_ml=3,
        stats=4,
        python=2,
        genai=1,
        total=15,
        subject_scores={"Total": 15, "Math": 5, "Physics": 3, "Chemistry": 4}
    )
    
    print(f"SubjectScores object: {subject_scores}")
    print(f"Subject scores dict: {subject_scores.subject_scores}")
    
    # Convert to dict
    scores_dict = subject_scores.dict()
    print(f"Dict representation: {scores_dict}")
    
    # Convert to JSON
    json_str = json.dumps(scores_dict)
    print(f"JSON representation: {json_str}")

if __name__ == "__main__":
    asyncio.run(test_api_response())
