"""
Image Processing Pipeline for OMR System
Modular preprocessing components for robust image handling
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from abc import ABC, abstractmethod
import json
from pathlib import Path


class ImagePreprocessor(ABC):
    """Abstract base class for image preprocessors"""
    
    def __init__(self, options: Dict[str, Any] = None):
        self.options = options or {}
    
    @abstractmethod
    def apply_filter(self, image: np.ndarray, file_path: str) -> np.ndarray:
        """Apply preprocessing filter to image"""
        pass


class CropPage(ImagePreprocessor):
    """Detect and crop page boundaries using edge detection"""
    
    def __init__(self, options: Dict[str, Any] = None):
        super().__init__(options)
        self.morph_kernel = tuple(self.options.get("morphKernel", [10, 10]))
        self.min_page_area = self.options.get("minPageArea", 100000)
    
    def apply_filter(self, image: np.ndarray, file_path: str) -> np.ndarray:
        """Detect page boundaries and crop image"""
        try:
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Normalize image
            gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
            
            # Apply threshold
            _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_TRUNC)
            
            # Morphological operations
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, self.morph_kernel)
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            # Edge detection
            edges = cv2.Canny(closed, 185, 55)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            contours = [cv2.convexHull(c) for c in contours]
            
            # Find largest rectangular contour
            for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
                if cv2.contourArea(c) < self.min_page_area:
                    continue
                
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, epsilon=0.025 * peri, closed=True)
                
                if self._validate_rect(approx):
                    # Apply perspective transformation
                    return self._crop_and_align(image, approx)
            
            # If no page found, return original
            return image
            
        except Exception as e:
            print(f"Error in CropPage: {e}")
            return image
    
    def _validate_rect(self, approx: np.ndarray) -> bool:
        """Validate if contour is rectangular"""
        if len(approx) != 4:
            return False
        
        # Check if it's roughly rectangular
        area = cv2.contourArea(approx)
        x, y, w, h = cv2.boundingRect(approx)
        rect_area = w * h
        
        return area / rect_area > 0.8
    
    def _crop_and_align(self, image: np.ndarray, corners: np.ndarray) -> np.ndarray:
        """Crop and align image using detected corners"""
        # Order points: top-left, top-right, bottom-right, bottom-left
        ordered_corners = self._order_points(corners.reshape(4, 2))
        
        # Define destination points
        width, height = self.options.get("outputSize", (666, 820))
        dst_points = np.array([
            [0, 0],
            [width - 1, 0],
            [width - 1, height - 1],
            [0, height - 1]
        ], dtype=np.float32)
        
        # Apply perspective transform
        matrix = cv2.getPerspectiveTransform(ordered_corners.astype(np.float32), dst_points)
        aligned = cv2.warpPerspective(image, matrix, (width, height))
        
        return aligned
    
    def _order_points(self, points: np.ndarray) -> np.ndarray:
        """Order points in correct order for perspective transform"""
        center = np.mean(points, axis=0)
        angles = np.arctan2(points[:, 1] - center[1], points[:, 0] - center[0])
        sorted_indices = np.argsort(angles)
        return points[sorted_indices]


class CropOnMarkers(ImagePreprocessor):
    """Align image using reference markers"""
    
    def __init__(self, options: Dict[str, Any] = None):
        super().__init__(options)
        self.marker_path = self.options.get("markerPath", "")
        self.min_matching_threshold = self.options.get("minMatchingThreshold", 0.6)
        self.output_size = self.options.get("outputSize", (666, 820))
    
    def apply_filter(self, image: np.ndarray, file_path: str) -> np.ndarray:
        """Align image using reference markers"""
        try:
            if not self.marker_path or not Path(self.marker_path).exists():
                return image
            
            # Load reference marker
            marker = cv2.imread(self.marker_path, cv2.IMREAD_GRAYSCALE)
            if marker is None:
                return image
            
            # Convert image to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Find best scale for marker
            best_scale, optimal_marker = self._get_best_match(gray, marker)
            if best_scale is None:
                return image
            
            # Divide image into quadrants
            h, w = gray.shape
            midh, midw = h // 3, w // 2
            quads = {
                0: gray[0:midh, 0:midw],
                1: gray[0:midh, midw:w],
                2: gray[midh:h, 0:midw],
                3: gray[midh:h, midw:w]
            }
            
            # Match marker in each quadrant
            centres = []
            for k in range(4):
                res = cv2.matchTemplate(quads[k], optimal_marker, cv2.TM_CCOEFF_NORMED)
                max_t = res.max()
                
                if max_t < self.min_matching_threshold:
                    return image
                
                pt = np.argwhere(res == max_t)[0]
                centres.append([pt[0] + optimal_marker.shape[0]//2, 
                              pt[1] + optimal_marker.shape[1]//2])
            
            # Apply perspective transformation
            return self._apply_perspective_transform(image, centres)
            
        except Exception as e:
            print(f"Error in CropOnMarkers: {e}")
            return image
    
    def _get_best_match(self, image: np.ndarray, marker: np.ndarray) -> Tuple[Optional[float], Optional[np.ndarray]]:
        """Find best scale for marker matching"""
        scales = [0.5, 0.75, 1.0, 1.25, 1.5]
        best_scale = None
        best_max = 0
        
        for scale in scales:
            h, w = int(marker.shape[0] * scale), int(marker.shape[1] * scale)
            if h < 10 or w < 10 or h > image.shape[0] or w > image.shape[1]:
                continue
            
            scaled_marker = cv2.resize(marker, (w, h))
            res = cv2.matchTemplate(image, scaled_marker, cv2.TM_CCOEFF_NORMED)
            max_val = res.max()
            
            if max_val > best_max:
                best_max = max_val
                best_scale = scale
        
        if best_scale is None:
            return None, None
        
        h, w = int(marker.shape[0] * best_scale), int(marker.shape[1] * best_scale)
        optimal_marker = cv2.resize(marker, (w, h))
        
        return best_scale, optimal_marker
    
    def _apply_perspective_transform(self, image: np.ndarray, centres: List[List[int]]) -> np.ndarray:
        """Apply perspective transformation using detected centres"""
        # Define target corners
        width, height = self.output_size
        target_corners = np.array([
            [0, 0],
            [width - 1, 0],
            [width - 1, height - 1],
            [0, height - 1]
        ], dtype=np.float32)
        
        # Apply perspective transform
        matrix = cv2.getPerspectiveTransform(np.array(centres, dtype=np.float32), target_corners)
        aligned = cv2.warpPerspective(image, matrix, (width, height))
        
        return aligned


class Levels(ImagePreprocessor):
    """Adjust image contrast and brightness"""
    
    def __init__(self, options: Dict[str, Any] = None):
        super().__init__(options)
        self.gamma = self.options.get("gamma", 1.0)
        self.alpha = self.options.get("alpha", 1.0)
        self.beta = self.options.get("beta", 0)
    
    def apply_filter(self, image: np.ndarray, file_path: str) -> np.ndarray:
        """Apply gamma correction and brightness adjustment"""
        try:
            # Apply gamma correction
            if self.gamma != 1.0:
                image = np.power(image / 255.0, self.gamma) * 255.0
                image = np.clip(image, 0, 255).astype(np.uint8)
            
            # Apply brightness and contrast
            if self.alpha != 1.0 or self.beta != 0:
                image = cv2.convertScaleAbs(image, alpha=self.alpha, beta=self.beta)
            
            return image
            
        except Exception as e:
            print(f"Error in Levels: {e}")
            return image


class GaussianBlur(ImagePreprocessor):
    """Apply Gaussian blur to reduce noise"""
    
    def __init__(self, options: Dict[str, Any] = None):
        super().__init__(options)
        self.kernel_size = self.options.get("kernelSize", (5, 5))
        self.sigma = self.options.get("sigma", 0)
    
    def apply_filter(self, image: np.ndarray, file_path: str) -> np.ndarray:
        """Apply Gaussian blur"""
        try:
            return cv2.GaussianBlur(image, self.kernel_size, self.sigma)
        except Exception as e:
            print(f"Error in GaussianBlur: {e}")
            return image


class ImageProcessorFactory:
    """Factory for creating image processors"""
    
    PROCESSORS = {
        "CropPage": CropPage,
        "CropOnMarkers": CropOnMarkers,
        "Levels": Levels,
        "GaussianBlur": GaussianBlur
    }
    
    @classmethod
    def create_processor(cls, processor_name: str, options: Dict[str, Any] = None) -> ImagePreprocessor:
        """Create processor by name"""
        if processor_name not in cls.PROCESSORS:
            raise ValueError(f"Unknown processor: {processor_name}")
        
        processor_class = cls.PROCESSORS[processor_name]
        return processor_class(options)
    
    @classmethod
    def create_processors_from_config(cls, config: List[Dict[str, Any]]) -> List[ImagePreprocessor]:
        """Create processors from configuration list"""
        processors = []
        
        for processor_config in config:
            name = processor_config.get("name")
            options = processor_config.get("options", {})
            
            if name:
                processor = cls.create_processor(name, options)
                processors.append(processor)
        
        return processors


class ImageInstanceOps:
    """Main image processing operations"""
    
    def __init__(self, tuning_config: Dict[str, Any]):
        self.tuning_config = tuning_config
        self.save_image_level = tuning_config.get("outputs", {}).get("save_image_level", 0)
    
    def apply_preprocessors(self, file_path: str, image: np.ndarray, preprocessors: List[ImagePreprocessor]) -> np.ndarray:
        """Apply preprocessing pipeline to image"""
        try:
            # Resize to processing dimensions
            processing_dims = self.tuning_config.get("dimensions", {})
            target_width = processing_dims.get("processing_width", 666)
            target_height = processing_dims.get("processing_height", 820)
            
            image = cv2.resize(image, (target_width, target_height))
            
            # Apply each preprocessor
            for processor in preprocessors:
                image = processor.apply_filter(image, file_path)
            
            return image
            
        except Exception as e:
            print(f"Error in apply_preprocessors: {e}")
            return image
    
    def save_debug_image(self, image: np.ndarray, file_path: str, suffix: str = ""):
        """Save debug image if configured"""
        if self.save_image_level > 0:
            try:
                debug_path = Path(file_path).parent / f"debug_{suffix}_{Path(file_path).name}"
                cv2.imwrite(str(debug_path), image)
            except Exception as e:
                print(f"Error saving debug image: {e}")
