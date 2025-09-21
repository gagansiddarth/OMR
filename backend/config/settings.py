"""
Configuration settings for OMR Evaluation Backend
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database settings
    database_url: str = "sqlite:///./omr_evaluation.db"
    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "omr_evaluation"
    database_user: str = "user"
    database_password: str = "password"
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    
    # File storage settings
    upload_dir: str = "uploads"
    output_dir: str = "outputs"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # OMR processing settings
    bubble_min_area: int = 100
    bubble_max_area: int = 2000
    fill_threshold_easy: float = 0.3
    fill_threshold_moderate: float = 0.5
    fill_threshold_strict: float = 0.8
    
    # Answer key settings
    answer_key_file: str = "data/answer_keys.json"
    exam_versions: list = ["A", "B", "C", "D"]
    
    # Logging settings
    log_level: str = "INFO"
    log_file: str = "logs/omr_evaluation.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings() -> Settings:
    """Get application settings"""
    return Settings()

# Create directories if they don't exist
def ensure_directories():
    """Ensure required directories exist"""
    directories = [
        "uploads",
        "outputs", 
        "logs",
        "data"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

# Initialize directories
ensure_directories()
