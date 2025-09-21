# OMR Evaluation Backend

Automated OMR (Optical Mark Recognition) evaluation system backend built with FastAPI.

## Features

- **Image Preprocessing**: Grayscale conversion, noise reduction, perspective correction
- **Bubble Detection**: OpenCV-based circular contour detection and sorting
- **Mark Detection**: Fill percentage analysis with configurable thresholds
- **Error Handling**: Detection of multiple/blank/overfilled bubbles
- **Answer Key Matching**: OCR-based exam version identification and scoring
- **Result Packaging**: Structured JSON output with audit trails
- **Database Storage**: PostgreSQL integration for result persistence
- **REST API**: FastAPI endpoints for OMR processing

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your database settings
```

### 3. Start the Server

```bash
python start.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check with database status

### OMR Processing
- `POST /process-omr` - Process uploaded OMR sheet
  - **Parameters**:
    - `file`: OMR sheet image (JPG/PNG/PDF)
    - `evaluation_mode`: "easy", "moderate", or "strict"
    - `student_id`: Optional student identifier

### Results Management
- `GET /results` - Get all results (paginated)
- `GET /results/{student_id}` - Get results for specific student
- `DELETE /results/{result_id}` - Delete specific result

## Evaluation Modes

### Easy Mode
- **Fill Threshold**: 30%
- **Tolerance**: High (10-20% variance allowed)
- **Use Case**: Handwritten or imperfectly filled sheets

### Moderate Mode (Default)
- **Fill Threshold**: 50%
- **Tolerance**: Medium
- **Use Case**: Standard printed OMR sheets

### Strict Mode
- **Fill Threshold**: 80%
- **Tolerance**: Low (precise filling required)
- **Use Case**: High-stakes examinations

## Processing Pipeline

1. **Image Preprocessing**
   - Convert to grayscale
   - Apply Gaussian blur for noise reduction
   - Apply OTSU thresholding
   - Perspective correction using fiducial markers

2. **Bubble Detection**
   - Find contours using OpenCV
   - Filter by area and circularity
   - Sort bubbles in reading order (row by row)

3. **Mark Detection**
   - Create masks for each bubble
   - Count filled pixels
   - Apply evaluation mode thresholds
   - Calculate confidence scores

4. **Error Handling**
   - Detect multiple filled bubbles per question
   - Identify blank questions
   - Flag overfilled bubbles

5. **Answer Key Matching**
   - OCR-based exam version detection
   - Match answers against correct key
   - Calculate subject-wise and total scores

6. **Result Packaging**
   - Generate structured JSON response
   - Create overlay image with marked bubbles
   - Store results in database

## Configuration

Edit `config/settings.py` or set environment variables:

```python
# Database
DATABASE_URL = "postgresql://user:password@localhost/omr_evaluation"

# Processing
FILL_THRESHOLD_EASY = 0.3
FILL_THRESHOLD_MODERATE = 0.5
FILL_THRESHOLD_STRICT = 0.8

# File Storage
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
```

## Database Schema

```sql
CREATE TABLE omr_results (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR NOT NULL,
    exam_version VARCHAR NOT NULL,
    subject_scores JSONB NOT NULL,
    total_score INTEGER NOT NULL,
    invalid_questions JSONB DEFAULT '[]',
    processing_metadata JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    overlay_image_path VARCHAR
);
```

## Example Usage

### Process OMR Sheet

```python
import requests

# Upload and process OMR sheet
with open('omr_sheet.jpg', 'rb') as f:
    files = {'file': f}
    data = {
        'evaluation_mode': 'moderate',
        'student_id': '12345'
    }
    
    response = requests.post(
        'http://localhost:8000/process-omr',
        files=files,
        data=data
    )
    
    result = response.json()
    print(f"Total Score: {result['subject_scores']['total']}/100")
```

### Get Student Results

```python
# Get all results for a student
response = requests.get('http://localhost:8000/results/12345')
results = response.json()
```

## Development

### Running in Development Mode

```bash
python start.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test OMR processing
curl -X POST "http://localhost:8000/process-omr" \
     -F "file=@test_omr.jpg" \
     -F "evaluation_mode=moderate" \
     -F "student_id=12345"
```

## Dependencies

- **FastAPI**: Web framework
- **OpenCV**: Image processing
- **NumPy**: Numerical operations
- **Pillow**: Image manipulation
- **Pytesseract**: OCR for exam version detection
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Database
- **Pydantic**: Data validation

## License

MIT License - see LICENSE file for details.
