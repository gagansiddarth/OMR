# OMR Vision - Automated OMR Evaluation System

A comprehensive Optical Mark Recognition (OMR) evaluation system with advanced AI-powered bubble detection, automated scoring, and flexible template configuration.

## 🚀 Features

- **Advanced OMR Processing**: Robust bubble detection using OpenCV and computer vision techniques
- **Flexible Template System**: JSON-based configuration for any OMR layout
- **Multiple Evaluation Modes**: Easy, Moderate, and Strict evaluation modes
- **Real-time Processing**: Fast and accurate OMR sheet processing
- **Dynamic Subject Support**: Support for custom subjects and answer keys
- **Visual Feedback**: Generated overlay images showing detected marks
- **Batch Processing**: Handle multiple OMR sheets efficiently
- **Comprehensive Scoring**: Detailed scoring reports with confidence metrics

## 🏗️ Architecture

### Frontend
- **React.js** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **ShadCN UI** components for modern interface
- **React Query** for data management

### Backend
- **FastAPI** for high-performance API
- **OpenCV** for image processing and bubble detection
- **Pydantic** for data validation
- **SQLite/PostgreSQL** for data storage
- **Comprehensive OMR Core** for advanced processing

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python start.py
```

## 📖 Usage

1. **Create Test**: Define your test with subjects and answer keys
2. **Upload OMR Sheets**: Upload scanned OMR sheets for processing
3. **Review Results**: View detailed scoring and analysis
4. **Export Data**: Download results in various formats

## 🔧 Configuration

### Template Configuration
The system uses JSON-based templates for OMR layout configuration:

```json
{
  "pageDimensions": [666, 820],
  "bubbleDimensions": [20, 20],
  "fieldBlocks": {
    "Questions": {
      "fieldType": "QTYPE_MCQ4",
      "origin": [50, 100],
      "bubblesGap": 50,
      "labelsGap": 60,
      "fieldLabels": ["q1", "q2", "q3", "q4"]
    }
  }
}
```

### Environment Variables
Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Start production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📊 API Endpoints

- `GET /health` - Health check
- `POST /process-omr` - Process OMR sheet
- `GET /results/{student_id}` - Get student results
- `GET /results` - Get all results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue on GitHub or contact the development team.

## 🔄 Version History

- **v1.0.0** - Initial release with comprehensive OMR processing
- **v1.1.0** - Added dynamic subject support and template system
- **v1.2.0** - Enhanced bubble detection and scoring algorithms