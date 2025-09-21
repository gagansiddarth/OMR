"""
OMR Template Configuration System
Handles JSON-based template definitions for OMR layouts
"""

import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Bubble:
    """Represents a single answer bubble"""
    x: float
    y: float
    field_label: str
    field_type: str
    field_value: str


@dataclass
class FieldBlock:
    """Represents a group of questions with the same layout"""
    name: str
    field_type: str
    origin: List[int]
    bubble_dimensions: List[int]
    bubbles_gap: int
    labels_gap: int
    field_labels: List[str]
    empty_value: str
    shift: int = 0
    traverse_bubbles: List[List[Bubble]] = None
    
    def __post_init__(self):
        if self.traverse_bubbles is None:
            self.traverse_bubbles = []
            self.generate_bubble_grid()
    
    def generate_bubble_grid(self):
        """Generate bubble grid based on field type and configuration"""
        field_types = {
            "QTYPE_INT": {
                "bubble_values": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
                "direction": "vertical"
            },
            "QTYPE_MCQ4": {
                "bubble_values": ["A", "B", "C", "D"], 
                "direction": "horizontal"
            },
            "QTYPE_MCQ5": {
                "bubble_values": ["A", "B", "C", "D", "E"], 
                "direction": "horizontal"
            }
        }
        
        if self.field_type not in field_types:
            raise ValueError(f"Unsupported field type: {self.field_type}")
        
        config = field_types[self.field_type]
        bubble_values = config["bubble_values"]
        direction = config["direction"]
        
        # Direction mapping: 0=horizontal, 1=vertical
        _h, _v = (1, 0) if direction == "vertical" else (0, 1)
        
        lead_point = [float(self.origin[0]), float(self.origin[1])]
        
        for field_label in self.field_labels:
            bubble_point = lead_point.copy()
            field_bubbles = []
            
            for bubble_value in bubble_values:
                field_bubbles.append(
                    Bubble(
                        x=bubble_point[0],
                        y=bubble_point[1],
                        field_label=field_label,
                        field_type=self.field_type,
                        field_value=bubble_value
                    )
                )
                bubble_point[_h] += self.bubbles_gap
            
            self.traverse_bubbles.append(field_bubbles)
            lead_point[_v] += self.labels_gap


class Template:
    """OMR Template configuration manager"""
    
    def __init__(self, template_path: str, tuning_config: Dict[str, Any]):
        self.path = template_path
        self.tuning_config = tuning_config
        self.page_dimensions: List[int] = []
        self.bubble_dimensions: List[int] = []
        self.field_blocks: List[FieldBlock] = []
        self.preprocessors_config: List[Dict[str, Any]] = []
        self.empty_value: str = ""
        
        self.load_template_config(template_path)
        self.setup_field_blocks()
    
    def load_template_config(self, template_path: str):
        """Load template configuration from JSON file"""
        try:
            with open(template_path, 'r') as f:
                config = json.load(f)
            
            self.page_dimensions = config["pageDimensions"]
            self.bubble_dimensions = config["bubbleDimensions"]
            self.empty_value = config.get("emptyValue", "")
            self.field_blocks_config = config["fieldBlocks"]
            self.preprocessors_config = config.get("preProcessors", [])
            
        except FileNotFoundError:
            # Create default template if file doesn't exist
            self.create_default_template(template_path)
        except Exception as e:
            raise ValueError(f"Error loading template config: {e}")
    
    def create_default_template(self, template_path: str):
        """Create a default template configuration"""
        default_config = {
            "pageDimensions": [666, 820],
            "bubbleDimensions": [20, 20],
            "emptyValue": "",
            "fieldBlocks": {
                "Questions": {
                    "fieldType": "QTYPE_MCQ4",
                    "origin": [50, 100],
                    "bubblesGap": 50,
                    "labelsGap": 60,
                    "fieldLabels": [f"q{i}" for i in range(1, 21)]
                }
            },
            "preProcessors": [
                {
                    "name": "CropPage",
                    "options": {"morphKernel": [10, 10]}
                }
            ]
        }
        
        # Ensure directory exists
        Path(template_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(template_path, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        # Load the created template
        self.load_template_config(template_path)
    
    def setup_field_blocks(self):
        """Setup field blocks from configuration"""
        self.field_blocks = []
        
        for block_name, block_config in self.field_blocks_config.items():
            field_block = FieldBlock(
                name=block_name,
                field_type=block_config["fieldType"],
                origin=block_config["origin"],
                bubble_dimensions=self.bubble_dimensions,
                bubbles_gap=block_config["bubblesGap"],
                labels_gap=block_config["labelsGap"],
                field_labels=block_config["fieldLabels"],
                empty_value=self.empty_value
            )
            self.field_blocks.append(field_block)
    
    def get_field_block_by_name(self, name: str) -> Optional[FieldBlock]:
        """Get field block by name"""
        for block in self.field_blocks:
            if block.name == name:
                return block
        return None
    
    def get_all_bubbles(self) -> List[Bubble]:
        """Get all bubbles from all field blocks"""
        all_bubbles = []
        for block in self.field_blocks:
            for field_bubbles in block.traverse_bubbles:
                all_bubbles.extend(field_bubbles)
        return all_bubbles
    
    def validate_template(self) -> bool:
        """Validate template configuration"""
        try:
            # Check required fields
            if not self.page_dimensions or len(self.page_dimensions) != 2:
                return False
            
            if not self.bubble_dimensions or len(self.bubble_dimensions) != 2:
                return False
            
            if not self.field_blocks:
                return False
            
            # Validate field blocks
            for block in self.field_blocks:
                if not block.traverse_bubbles:
                    return False
                
                for field_bubbles in block.traverse_bubbles:
                    if not field_bubbles:
                        return False
            
            return True
            
        except Exception:
            return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert template to dictionary"""
        return {
            "pageDimensions": self.page_dimensions,
            "bubbleDimensions": self.bubble_dimensions,
            "emptyValue": self.empty_value,
            "fieldBlocks": {
                block.name: {
                    "fieldType": block.field_type,
                    "origin": block.origin,
                    "bubblesGap": block.bubbles_gap,
                    "labelsGap": block.labels_gap,
                    "fieldLabels": block.field_labels
                }
                for block in self.field_blocks
            },
            "preProcessors": self.preprocessors_config
        }
    
    def save_template(self, output_path: str):
        """Save template configuration to file"""
        with open(output_path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
