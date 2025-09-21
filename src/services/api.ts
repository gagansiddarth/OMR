import { 
  UploadResponse, 
  UploadStatusResponse, 
  OMRResult, 
  ExportResponse, 
  LLMExplanationResponse 
} from '@/types';

// Mock API Configuration
const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

// Sample OMR Result Data
export const sampleResult: OMRResult = {
  upload_id: "u123",
  student_id: "S2025_001", 
  sheet_version: "v1",
  per_question: [
    {"q_idx": 1, "choice": "B", "confidence": 0.92, "features": {"mean_intensity": 45, "dark_ratio": 0.72}},
    {"q_idx": 2, "choice": "A", "confidence": 0.87, "features": {"mean_intensity": 42, "dark_ratio": 0.68}},
    {"q_idx": 3, "choice": "C", "confidence": 0.34, "features": {"mean_intensity": 65, "dark_ratio": 0.45}},
    {"q_idx": 4, "choice": "D", "confidence": 0.95, "features": {"mean_intensity": 38, "dark_ratio": 0.78}},
    {"q_idx": 5, "choice": "A", "confidence": 0.91, "features": {"mean_intensity": 41, "dark_ratio": 0.74}},
    {"q_idx": 6, "choice": "B", "confidence": 0.88, "features": {"mean_intensity": 43, "dark_ratio": 0.71}},
    {"q_idx": 7, "choice": "C", "confidence": 0.29, "features": {"mean_intensity": 67, "dark_ratio": 0.42}},
    {"q_idx": 8, "choice": "A", "confidence": 0.23, "features": {"mean_intensity": 72, "dark_ratio": 0.38}},
    {"q_idx": 9, "choice": "D", "confidence": 0.94, "features": {"mean_intensity": 39, "dark_ratio": 0.76}},
    {"q_idx": 10, "choice": "B", "confidence": 0.89, "features": {"mean_intensity": 44, "dark_ratio": 0.69}},
  ],
  per_subject_scores: {"Physics": 18, "Math": 16, "English": 19, "Total": 53},
  flags: {"no_fiducials": false, "ambiguous_questions": [3,7], "low_confidence": [8]},
  artifacts: {
    "original_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9yaWdpbmFsIE9NUiBTaGVldDwvdGV4dD48L3N2Zz4=",
    "warped_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldycHBlZCBPTVIgU2hlZXQ8L3RleHQ+PC9zdmc+",
    "overlay_url": "/samples/u123_overlay.png"
  },
  processed_at: "2025-09-20T14:32:00Z"
};

// Mock API Functions (Replace URLs with real endpoints)
export const mockAPI = {
  async upload(file: File): Promise<UploadResponse> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { upload_id: `u${Date.now()}`, status: 'processing' };
  },

  async getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
    // Mock processing states
    const states = ['processing', 'processing', 'complete'];
    return { status: states[Math.floor(Math.random() * states.length)], progress: Math.random() * 100 };
  },

  async getResult(uploadId: string): Promise<OMRResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...sampleResult, upload_id: uploadId };
  },

  async correctResult(uploadId: string, corrections: any[]): Promise<OMRResult> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { ...sampleResult, upload_id: uploadId };
  },

  async exportData(examId: string, format: string): Promise<ExportResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { download_url: `/exports/${examId}.${format}` };
  },

  async getFlagged(limit: number = 50): Promise<OMRResult[]> {
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      ...sampleResult,
      upload_id: `flagged_${i}`,
      student_id: `S2025_${String(i + 100).padStart(3, '0')}`
    }));
  },

  async getLLMExplanation(data: OMRResult): Promise<LLMExplanationResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      explanation: "The low confidence scores for questions 3, 7, and 8 suggest possible erasure marks or multiple selections. The dark ratio indicates incomplete bubble filling, which commonly occurs when students change their answers.",
      recommended_action: "Manual review recommended for questions 3, 7, and 8. Consider re-scanning if image quality appears degraded.",
      severity: "medium"
    };
  }
};
