# OMR Evaluation Backend Setup Guide

## 🚀 Complete Backend Module for Automated OMR Evaluation

This guide will help you set up and run the complete backend module for the OMR Evaluation System.

## 📋 Prerequisites

- Python 3.8+ installed
- PostgreSQL database (local or cloud)
- OpenCV dependencies (for image processing)
- Tesseract OCR (for exam version detection)

## 🛠️ Installation

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install System Dependencies

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y python3-opencv
sudo apt-get install -y tesseract-ocr
sudo apt-get install -y libtesseract-dev
```

#### macOS:
```bash
brew install opencv
brew install tesseract
```

#### Windows:
- Download OpenCV from: https://opencv.org/releases/
- Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Set Up Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb omr_evaluation
sudo -u postgres createuser omr_user
sudo -u postgres psql -c "ALTER USER omr_user PASSWORD 'omr_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE omr_evaluation TO omr_user;"
```

#### Option B: Docker PostgreSQL
```bash
docker run --name omr-postgres \
  -e POSTGRES_DB=omr_evaluation \
  -e POSTGRES_USER=omr_user \
  -e POSTGRES_PASSWORD=omr_password \
  -p 5432:5432 \
  -d postgres:13
```

### 4. Configure Environment

```bash
cd backend
cp env.example .env
```

Edit `.env` with your database settings:
```env
DATABASE_URL=postgresql://omr_user:omr_password@localhost:5432/omr_evaluation
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=omr_evaluation
DATABASE_USER=omr_user
DATABASE_PASSWORD=omr_password
```

## 🚀 Running the Backend

### Development Mode
```bash
cd backend
python start.py
```

### Production Mode
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

## 📊 API Endpoints

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

## 🧪 Testing the Backend

### 1. Test Health Endpoints
```bash
curl http://localhost:8000/health
```

### 2. Test OMR Processing
```bash
# Using the test script
python test_api.py

# Or manually with curl
curl -X POST "http://localhost:8000/process-omr" \
     -F "file=@test_omr.jpg" \
     -F "evaluation_mode=moderate" \
     -F "student_id=12345"
```

### 3. Test Results Endpoints
```bash
curl http://localhost:8000/results
curl http://localhost:8000/results/12345
```

## 🔧 Configuration

### Evaluation Modes

| Mode | Fill Threshold | Use Case |
|------|----------------|----------|
| Easy | 30% | Handwritten or imperfect sheets |
| Moderate | 50% | Standard printed OMR sheets |
| Strict | 80% | High-stakes examinations |

### Processing Settings

Edit `config/settings.py` or set environment variables:

```python
# Bubble Detection
BUBBLE_MIN_AREA = 100      # Minimum bubble area in pixels
BUBBLE_MAX_AREA = 2000     # Maximum bubble area in pixels

# Fill Thresholds
FILL_THRESHOLD_EASY = 0.3      # 30%
FILL_THRESHOLD_MODERATE = 0.5  # 50%
FILL_THRESHOLD_STRICT = 0.8    # 80%

# File Storage
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
MAX_FILE_SIZE = 10485760  # 10MB
```

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application
├── start.py               # Startup script
├── test_api.py            # API test script
├── requirements.txt       # Python dependencies
├── env.example           # Environment template
├── README.md             # Backend documentation
├── config/
│   └── settings.py       # Configuration settings
├── models/
│   └── schemas.py        # Pydantic schemas
├── services/
│   ├── omr_processor.py  # Core OMR processing
│   └── database.py       # Database operations
├── data/
│   └── answer_keys.json  # Answer keys for different versions
├── uploads/              # Uploaded files (created automatically)
├── outputs/              # Processed results (created automatically)
└── logs/                 # Log files (created automatically)
```

## 🔄 Integration with Frontend

The frontend automatically detects if the backend is available and uses it for processing. If the backend is not available, it falls back to mock processing.

### Frontend Configuration

Add to your `.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

### Backend-Frontend Flow

1. **Upload**: User uploads OMR sheet in frontend
2. **API Call**: Frontend calls `/process-omr` endpoint
3. **Processing**: Backend processes image with OpenCV
4. **Database**: Results stored in PostgreSQL
5. **Response**: Structured JSON returned to frontend
6. **Display**: Frontend shows results and overlay image

## 🐛 Troubleshooting

### Common Issues

1. **OpenCV Import Error**
   ```bash
   pip uninstall opencv-python
   pip install opencv-python-headless
   ```

2. **Tesseract Not Found**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr
   
   # macOS
   brew install tesseract
   ```

3. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

4. **Permission Errors**
   ```bash
   chmod +x start.py
   chmod +x test_api.py
   ```

### Logs

Check logs for detailed error information:
```bash
tail -f logs/omr_evaluation.log
```

## 🚀 Production Deployment

### Using Docker

```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy application
COPY . /app
WORKDIR /app

# Install Python dependencies
RUN pip install -r requirements.txt

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "start.py"]
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://omr_user:omr_password@db:5432/omr_evaluation
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads
      - ./outputs:/app/outputs

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=omr_evaluation
      - POSTGRES_USER=omr_user
      - POSTGRES_PASSWORD=omr_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 📈 Performance Optimization

### For High-Volume Processing

1. **Increase Workers**
   ```bash
   uvicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
   ```

2. **Database Connection Pooling**
   ```python
   # In config/settings.py
   DATABASE_POOL_SIZE = 20
   DATABASE_MAX_OVERFLOW = 30
   ```

3. **Caching**
   ```python
   # Add Redis for caching
   pip install redis
   ```

4. **Async Processing**
   ```python
   # Use Celery for background processing
   pip install celery
   ```

## 🔒 Security Considerations

1. **Input Validation**: All file uploads are validated
2. **File Size Limits**: Configurable maximum file size
3. **Database Security**: Use environment variables for credentials
4. **CORS**: Configured for specific origins
5. **Rate Limiting**: Consider adding rate limiting for production

## 📚 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

## 🎯 Next Steps

1. **Test with Real OMR Sheets**: Upload actual OMR sheet images
2. **Tune Parameters**: Adjust bubble detection and fill thresholds
3. **Add Monitoring**: Set up logging and monitoring
4. **Scale**: Deploy to cloud with load balancing
5. **Integrate**: Connect with your existing systems

## 🆘 Support

For issues or questions:
1. Check the logs: `logs/omr_evaluation.log`
2. Test the API: `python test_api.py`
3. Verify configuration: Check `.env` file
4. Check database connection: `curl http://localhost:8000/health`

The backend is now ready for production OMR evaluation! 🎉
