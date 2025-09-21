"""
OMR Core Package
Comprehensive Optical Mark Recognition system
"""

from .core import OMRCore, create_omr_core
from .template import Template, FieldBlock, Bubble
from .processors import ImageProcessorFactory, ImageInstanceOps
from .bubble_detection import BubbleDetector, BubbleDetectionResult
from .evaluation import OMREvaluator, EvaluationConfig, ScoringReport, EvaluationResult

__all__ = [
    'OMRCore',
    'create_omr_core',
    'Template',
    'FieldBlock', 
    'Bubble',
    'ImageProcessorFactory',
    'ImageInstanceOps',
    'BubbleDetector',
    'BubbleDetectionResult',
    'OMREvaluator',
    'EvaluationConfig',
    'ScoringReport',
    'EvaluationResult'
]
