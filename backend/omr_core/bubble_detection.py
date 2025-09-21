"""
Advanced Bubble Detection System
Implements global and local thresholding for robust bubble detection
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass


@dataclass
class BubbleDetectionResult:
    """Result of bubble detection for a single bubble"""
    is_marked: bool
    confidence: float
    intensity: float
    threshold_used: float
    bubble: 'Bubble'


class BubbleDetector:
    """Advanced bubble detection with multiple thresholding strategies"""
    
    def __init__(self, tuning_config: Dict[str, Any]):
        self.tuning_config = tuning_config
        self.threshold_params = tuning_config.get("threshold_params", {})
        
        # Threshold parameters
        self.gamma_low = self.threshold_params.get("GAMMA_LOW", 0.7)
        self.min_gap = self.threshold_params.get("MIN_GAP", 30)
        self.min_jump = self.threshold_params.get("MIN_JUMP", 25)
        self.confident_surplus = self.threshold_params.get("CONFIDENT_SURPLUS", 5)
        self.jump_delta = self.threshold_params.get("JUMP_DELTA", 30)
        self.page_type = self.threshold_params.get("PAGE_TYPE_FOR_THRESHOLD", "white")
        
        # Global default threshold
        self.global_default_threshold = 200 if self.page_type == "white" else 100
    
    def detect_bubbles(self, image: np.ndarray, template, file_path: str = None) -> Dict[str, Any]:
        """Main bubble detection pipeline"""
        try:
            # Resize image to template dimensions
            img = cv2.resize(image, (template.page_dimensions[0], template.page_dimensions[1]))
            
            # Normalize image
            if img.max() > img.min():
                img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
            
            # Convert to grayscale if needed
            if len(img.shape) == 3:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            else:
                gray = img.copy()
            
            # Calculate global threshold
            global_thr, global_low, global_high = self.get_global_threshold(gray)
            
            # Process each field block
            omr_response = {}
            final_marked = []
            multi_marked = []
            multi_roll = []
            
            for field_block in template.field_blocks:
                field_response, marked, multi, roll = self.process_field_block(
                    field_block, gray, global_thr, template.bubble_dimensions
                )
                omr_response.update(field_response)
                final_marked.extend(marked)
                multi_marked.extend(multi)
                multi_roll.extend(roll)
            
            return {
                "omr_response": omr_response,
                "final_marked": final_marked,
                "multi_marked": multi_marked,
                "multi_roll": multi_roll,
                "global_threshold": global_thr
            }
            
        except Exception as e:
            print(f"Error in detect_bubbles: {e}")
            return {
                "omr_response": {},
                "final_marked": [],
                "multi_marked": [],
                "multi_roll": [],
                "global_threshold": self.global_default_threshold
            }
    
    def get_global_threshold(self, image: np.ndarray, plot_title: str = None, plot_show: bool = False) -> Tuple[float, float, float]:
        """Calculate global threshold using intensity distribution analysis"""
        try:
            # Flatten image and get intensity values
            q_vals_orig = image.flatten()
            q_vals = sorted(q_vals_orig)
            
            # Find largest gap in intensity distribution
            l = len(q_vals) - 1
            max1, thr1 = self.min_jump, self.global_default_threshold
            
            for i in range(1, l):
                jump = q_vals[i + 1] - q_vals[i - 1]
                if jump > max1:
                    max1 = jump
                    thr1 = q_vals[i - 1] + jump / 2
            
            # Calculate threshold bounds
            thr_low = thr1 - max1 // 2
            thr_high = thr1 + max1 // 2
            
            # Apply gamma correction if needed
            if self.gamma_low < 1.0:
                thr1 = thr1 * self.gamma_low
                thr_low = thr_low * self.gamma_low
                thr_high = thr_high * self.gamma_low
            
            return thr1, thr_low, thr_high
            
        except Exception as e:
            print(f"Error in get_global_threshold: {e}")
            return self.global_default_threshold, self.global_default_threshold - 50, self.global_default_threshold + 50
    
    def get_local_threshold(self, q_vals: List[float], global_thr: float, no_outliers: bool = True, 
                          plot_title: str = None, plot_show: bool = False) -> float:
        """Calculate local threshold for a specific question strip"""
        try:
            if len(q_vals) < 3:
                return global_thr if np.max(q_vals) - np.min(q_vals) < self.min_gap else np.mean(q_vals)
            
            q_vals = sorted(q_vals)
            
            # Find largest gap in local values
            l = len(q_vals) - 1
            max1, thr1 = self.min_jump, 255
            
            for i in range(1, l):
                jump = q_vals[i + 1] - q_vals[i - 1]
                if jump > max1:
                    max1 = jump
                    thr1 = q_vals[i - 1] + jump / 2
            
            # Use global threshold if local confidence is low
            confident_jump = self.min_jump + self.confident_surplus
            if max1 < confident_jump:
                return global_thr if no_outliers else global_thr
            
            return thr1
            
        except Exception as e:
            print(f"Error in get_local_threshold: {e}")
            return global_thr
    
    def process_field_block(self, field_block, image: np.ndarray, global_thr: float, 
                          bubble_dimensions: List[int]) -> Tuple[Dict[str, str], List[str], List[str], List[str]]:
        """Process a single field block"""
        try:
            box_w, box_h = bubble_dimensions
            field_response = {}
            marked = []
            multi_marked = []
            multi_roll = []
            
            # Collect all bubble intensities for local thresholding
            all_intensities = []
            for field_bubbles in field_block.traverse_bubbles:
                for bubble in field_bubbles:
                    x, y = int(bubble.x + field_block.shift), int(bubble.y)
                    rect = [y, y + box_h, x, x + box_w]
                    
                    # Ensure coordinates are within image bounds
                    if (rect[0] >= 0 and rect[1] <= image.shape[0] and 
                        rect[2] >= 0 and rect[3] <= image.shape[1]):
                        bubble_intensity = cv2.mean(image[rect[0]:rect[1], rect[2]:rect[3]])[0]
                        all_intensities.append(bubble_intensity)
            
            # Calculate local threshold for this field block
            local_thr = self.get_local_threshold(all_intensities, global_thr)
            
            # Process each question
            for field_bubbles in field_block.traverse_bubbles:
                field_label = field_bubbles[0].field_label
                detected_bubbles = []
                
                # Check each bubble for this question
                for bubble in field_bubbles:
                    x, y = int(bubble.x + field_block.shift), int(bubble.y)
                    rect = [y, y + box_h, x, x + box_w]
                    
                    # Ensure coordinates are within image bounds
                    if (rect[0] >= 0 and rect[1] <= image.shape[0] and 
                        rect[2] >= 0 and rect[3] <= image.shape[1]):
                        
                        bubble_intensity = cv2.mean(image[rect[0]:rect[1], rect[2]:rect[3]])[0]
                        bubble_is_marked = local_thr > bubble_intensity
                        
                        if bubble_is_marked:
                            detected_bubbles.append(bubble)
                
                # Handle detection results
                if len(detected_bubbles) > 1:
                    # Multiple bubbles marked
                    multi_marked.append(field_label)
                    field_response[field_label] = ''.join([b.field_value for b in detected_bubbles])
                elif len(detected_bubbles) == 1:
                    # Single bubble marked
                    field_response[field_label] = detected_bubbles[0].field_value
                    marked.append(field_label)
                else:
                    # No bubbles marked
                    field_response[field_label] = field_block.empty_value
            
            return field_response, marked, multi_marked, multi_roll
            
        except Exception as e:
            print(f"Error in process_field_block: {e}")
            return {}, [], [], []
    
    def detect_bubble_with_confidence(self, image: np.ndarray, bubble, bubble_dimensions: List[int], 
                                    threshold: float) -> BubbleDetectionResult:
        """Detect a single bubble with confidence score"""
        try:
            box_w, box_h = bubble_dimensions
            x, y = int(bubble.x), int(bubble.y)
            
            # Ensure coordinates are within image bounds
            if (y >= 0 and y + box_h <= image.shape[0] and 
                x >= 0 and x + box_w <= image.shape[1]):
                
                rect = [y, y + box_h, x, x + box_w]
                bubble_intensity = cv2.mean(image[rect[0]:rect[1], rect[2]:rect[3]])[0]
                
                is_marked = threshold > bubble_intensity
                confidence = abs(bubble_intensity - threshold) / 255.0
                confidence = min(confidence, 1.0)
                
                return BubbleDetectionResult(
                    is_marked=is_marked,
                    confidence=confidence,
                    intensity=bubble_intensity,
                    threshold_used=threshold,
                    bubble=bubble
                )
            else:
                return BubbleDetectionResult(
                    is_marked=False,
                    confidence=0.0,
                    intensity=255.0,
                    threshold_used=threshold,
                    bubble=bubble
                )
                
        except Exception as e:
            print(f"Error in detect_bubble_with_confidence: {e}")
            return BubbleDetectionResult(
                is_marked=False,
                confidence=0.0,
                intensity=255.0,
                threshold_used=threshold,
                bubble=bubble
            )
    
    def visualize_detection(self, image: np.ndarray, template, detection_results: Dict[str, Any], 
                          output_path: str = None) -> np.ndarray:
        """Create visualization of bubble detection results"""
        try:
            # Create a copy of the image for visualization
            vis_image = image.copy()
            if len(vis_image.shape) == 2:
                vis_image = cv2.cvtColor(vis_image, cv2.COLOR_GRAY2BGR)
            
            # Draw detected bubbles
            for field_block in template.field_blocks:
                for field_bubbles in field_block.traverse_bubbles:
                    for bubble in field_bubbles:
                        x, y = int(bubble.x + field_block.shift), int(bubble.y)
                        w, h = template.bubble_dimensions
                        
                        # Check if this bubble was marked
                        field_label = bubble.field_label
                        is_marked = detection_results["omr_response"].get(field_label) == bubble.field_value
                        
                        # Choose color based on detection result
                        color = (0, 255, 0) if is_marked else (0, 0, 255)  # Green for marked, Red for unmarked
                        thickness = 2 if is_marked else 1
                        
                        # Draw rectangle
                        cv2.rectangle(vis_image, (x, y), (x + w, y + h), color, thickness)
                        
                        # Add text label
                        cv2.putText(vis_image, bubble.field_value, (x, y - 5), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Save visualization if output path provided
            if output_path:
                cv2.imwrite(output_path, vis_image)
            
            return vis_image
            
        except Exception as e:
            print(f"Error in visualize_detection: {e}")
            return image
