# OMR Evaluation & Scoring System - Project Context

## 🎯 Project Overview

**Product Name:** Automated OMR Evaluation & Scoring System  
**Core USP:** Configurable evaluation strictness modes (Easy/Moderate/Strict) that align machine judgment with human fairness  
**Target Users:** Educational institutions, exam evaluators, assessment centers  

## 🚀 Unique Selling Points

1. **Humanized Evaluation Modes** - Unlike rigid OMR tools, our system adapts to human fairness standards
2. **Explainable AI** - Every flagged decision comes with clear, human-readable explanations
3. **Human-in-the-loop Overrides** - Evaluators can manually correct with full audit trails
4. **Advanced Analytics** - Subject-wise performance insights and class analytics
5. **Audit Overlay System** - Visual corrections with highlighted bubble overlays

## 🏗️ System Architecture

### Frontend (Evaluator Dashboard)
- **Framework:** React + TypeScript + Vite (Current Implementation)
- **UI Library:** ShadCN UI Components
- **State Management:** React Query + Context API
- **Styling:** Tailwind CSS

### Backend API
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (Production) / SQLite (MVP)
- **File Storage:** Local/Cloud storage for OMR sheets
- **Authentication:** JWT-based auth system

### OMR Evaluation Core
- **Computer Vision:** OpenCV + NumPy
- **Machine Learning:** TensorFlow Lite / scikit-learn
- **AI Agent:** LangChain + LangGraph
- **LLM:** OpenAI GPT-4o-mini / HuggingFace models

## 📋 Core Features

### 1. Upload Interface
- **Multi-format Support:** Images (JPG, PNG) and PDFs
- **Bulk Upload:** Single/multiple sheet uploads
- **Drag-and-drop:** Intuitive file handling
- **Live Preview:** Thumbnail generation for uploaded sheets
- **Progress Tracking:** Real-time upload status

### 2. Evaluation Mode Selector (USP Feature)
- **Easy Mode:**
  - ±10-20% tolerance in bubble filling
  - Accepts faint marks within tolerance band
  - Human-friendly evaluation approach
- **Moderate Mode:**
  - Default evaluation (0.2-0.6 range sent to AI)
  - Hybrid CV + ML + AI approach
  - Balanced strictness
- **Strict Mode:**
  - Enforces precise fill rules
  - Rejects faint/overfilled marks
  - Machine-precise evaluation

### 3. Flagged Cases Panel
- **AI Flagging:** Highlight ambiguous questions
- **Confidence Scores:** Display AI confidence levels
- **Visual Indicators:** Color-coded bubble status
- **Manual Override:** Evaluator correction interface

### 4. Results Dashboard
- **Per-student Scores:** Subject-wise + total scoring
- **Aggregate Statistics:** Class averages, performance metrics
- **Export Options:** CSV, Excel, PDF reports
- **Analytics:** Subject-wise performance insights

## 🔧 Technical Implementation

### Frontend Structure (Current)
```
src/
├── components/
│   ├── ui/              # ShadCN UI components
│   ├── layout/          # Navigation, sidebar
│   ├── features/        # OMR-specific components
│   └── common/          # Shared components
├── pages/
│   ├── auth/            # Authentication
│   ├── upload/          # File upload interface
│   ├── dashboard/       # Processing queue
│   ├── results/         # Results display
│   ├── review/          # Review & correction
│   ├── analytics/       # Performance analytics
│   └── export/          # Export functionality
├── services/            # API services
├── types/               # TypeScript interfaces
├── utils/               # Utility functions
├── constants/           # App constants
└── hooks/               # Custom React hooks
```

### Backend API Endpoints
```
POST   /api/upload           # Upload OMR sheets
POST   /api/evaluate         # Run CV + AI pipeline
GET    /api/results/{id}     # Fetch scores + explanations
POST   /api/results/{id}/correct  # Manual corrections
GET    /api/export           # Download reports
GET    /api/flagged          # Get flagged cases
POST   /api/llm/explain      # Generate AI explanations
```

### OMR Evaluation Pipeline
1. **Preprocessing**
   - Orientation correction (OpenCV)
   - Skew & illumination adjustment
   - Image quality enhancement

2. **Bubble Detection**
   - Contour detection + grid mapping
   - Fill ratio calculation
   - Confidence scoring

3. **Evaluation Modes**
   - Easy: Tolerance-based acceptance
   - Moderate: Hybrid CV + ML + AI
   - Strict: Precise fill validation

4. **Ambiguity Resolution**
   - ML Classifier: filled/unfilled/smudge/multiple
   - LLM Agent: Human-readable explanations

### AI Agent Workflow (LangGraph)
```
PreprocessNode → DetectBubblesNode → EvaluateModeNode → 
MLClassifierNode → RuleEngineNode → LLMExplanationNode → 
ResultStorageNode
```

## 🗄️ Database Schema

### Core Tables
- **students:** Student information and IDs
- **omr_sheets:** Uploaded sheet metadata
- **evaluations:** Evaluation results and scores
- **flagged_answers:** AI-flagged questions with explanations
- **audit_logs:** Manual corrections and overrides
- **evaluation_modes:** Mode configurations and settings

### Data Storage
- **Student Data:** ID, name, class, subject preferences
- **Sheet Data:** Upload timestamp, file path, processing status
- **Evaluation Data:** Scores, confidence levels, mode used
- **Audit Data:** Corrections, timestamps, evaluator info

## 🎨 User Experience Flow

### 1. Authentication
- Login with credentials or demo mode
- Role-based access (evaluator/admin)
- Session management

### 2. Upload Process
- Drag-and-drop interface
- Live preview of uploaded sheets
- Batch processing capabilities
- Progress tracking

### 3. Evaluation Selection
- Choose evaluation mode (Easy/Moderate/Strict)
- Configure tolerance settings
- Preview mode-specific rules

### 4. Processing & Review
- Real-time processing status
- Flagged cases highlighting
- Manual correction interface
- AI explanation display

### 5. Results & Analytics
- Individual student scores
- Class performance analytics
- Export functionality
- Historical data access

## 🔍 AI/ML Components

### Computer Vision Pipeline
- **Image Preprocessing:** OpenCV-based enhancement
- **Bubble Detection:** Contour analysis and grid mapping
- **Fill Analysis:** Pixel density and fill ratio calculation

### Machine Learning Models
- **Classification:** TensorFlow Lite models for bubble state
- **Confidence Scoring:** ML-based confidence assessment
- **Pattern Recognition:** Smudge and multiple mark detection

### LLM Integration
- **Explanation Generation:** Human-readable decision explanations
- **Rule Application:** Mode-specific rule enforcement
- **Context Understanding:** Question and answer context analysis

## 📊 Analytics & Reporting

### Performance Metrics
- **Individual Scores:** Per-student subject-wise performance
- **Class Analytics:** Average scores, distribution analysis
- **Subject Insights:** Weak areas identification
- **Trend Analysis:** Performance over time

### Export Formats
- **CSV:** Raw data for further analysis
- **Excel:** Formatted reports with charts
- **PDF:** Professional evaluation reports
- **JSON:** API-friendly data format

## 🔒 Security & Compliance

### Data Protection
- **Secure Upload:** Encrypted file storage
- **Access Control:** Role-based permissions
- **Audit Trails:** Complete action logging
- **Data Retention:** Configurable retention policies

### Privacy Considerations
- **Student Data:** Anonymization options
- **Secure Processing:** Local processing capabilities
- **Compliance:** GDPR/educational data protection

## 🚀 Development Roadmap

### Phase 1: Core Frontend (Current)
- ✅ Modular React architecture
- ✅ UI component library setup
- ✅ Basic navigation and routing
- ✅ Upload interface foundation

### Phase 2: Backend API
- [ ] FastAPI server setup
- [ ] Database schema implementation
- [ ] Authentication system
- [ ] Core API endpoints

### Phase 3: OMR Processing
- [ ] OpenCV preprocessing pipeline
- [ ] Bubble detection algorithms
- [ ] Evaluation mode implementation
- [ ] ML model integration

### Phase 4: AI Integration
- [ ] LangChain/LangGraph setup
- [ ] LLM explanation generation
- [ ] Ambiguity resolution
- [ ] Human-in-the-loop workflows

### Phase 5: Advanced Features
- [ ] Analytics dashboard
- [ ] Advanced reporting
- [ ] Performance optimization
- [ ] Production deployment

## 🎯 Success Metrics

### Technical KPIs
- **Processing Speed:** < 30 seconds per sheet
- **Accuracy:** > 95% correct evaluation
- **Uptime:** 99.9% availability
- **Response Time:** < 2 seconds for API calls

### User Experience KPIs
- **Upload Success Rate:** > 99%
- **User Satisfaction:** > 4.5/5 rating
- **Error Rate:** < 1% processing errors
- **Adoption Rate:** Target user engagement

## 🔧 Configuration & Settings

### Evaluation Modes
- **Easy Mode:** 10-20% tolerance, human-friendly
- **Moderate Mode:** 0.2-0.6 range, balanced approach
- **Strict Mode:** Precise rules, machine accuracy

### System Settings
- **File Size Limits:** Configurable upload limits
- **Processing Timeouts:** Adjustable processing limits
- **Confidence Thresholds:** Customizable AI confidence levels
- **Export Formats:** Multiple output options

## 📝 Development Notes

### Current Status
- Frontend architecture is complete and modular
- TypeScript interfaces are defined
- UI components are organized and reusable
- Ready for backend integration

### Next Steps
1. Implement FastAPI backend
2. Set up PostgreSQL database
3. Integrate OpenCV processing pipeline
4. Add LangChain AI workflows
5. Implement evaluation modes

### Technical Debt
- Need to implement proper error handling
- Add comprehensive testing suite
- Optimize bundle size and performance
- Add accessibility features

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Frontend Complete, Backend Pending
