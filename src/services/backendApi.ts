/**
 * Backend API Service
 * Handles communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('Backend API URL:', API_BASE_URL);
console.log('Environment variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL
});

export interface BackendOMRResult {
  success: boolean;
  student_id: string;
  exam_version: string;
  subject_scores: {
    math: number;
    ai_ml: number;
    stats: number;
    python: number;
    genai: number;
    total: number;
  };
  invalid_questions: number[];
  bubble_detections: Array<{
    question_number: number;
    bubble_letter: string;
    is_filled: boolean;
    fill_percentage: number;
    confidence: number;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  processing_metadata: {
    processing_time_ms: number;
    image_width: number;
    image_height: number;
    bubbles_detected: number;
    invalid_questions: number[];
    error_messages: string[];
    evaluation_mode: string;
    exam_version: string;
  };
  result_id?: string;
  created_at: string;
  overlay_image_url?: string;
}

export interface BackendError {
  error: string;
  detail?: string;
  timestamp: string;
}

class BackendAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('Backend API Service initialized with URL:', this.baseURL);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('Making request to:', url);
    console.log('Request options:', options);
    
    // Only set Content-Type for JSON requests, not for FormData
    const defaultHeaders: Record<string, string> = {};
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData: BackendError = await response.json().catch(() => ({
          error: 'Unknown error',
          detail: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        }));
        
        console.error('Response error:', errorData);
        throw new Error(errorData.detail || errorData.error);
      }

      const result = await response.json();
      console.log('Response data:', result);
      return result;
    } catch (error) {
      console.error('Backend API request failed:', error);
      throw error;
    }
  }

  /**
   * Check if backend is healthy
   */
  async healthCheck(): Promise<{ status: string; database: string; omr_processor: string }> {
    console.log('Checking backend health at:', `${this.baseURL}/health`);
    return this.makeRequest('/health');
  }

  /**
   * Process OMR sheet with backend
   */
  async processOMRSheet(
    file: File,
    evaluationMode: 'easy' | 'moderate' | 'strict',
    studentId?: string,
    testData?: { subjects: any[], answerKey: string[] }
  ): Promise<BackendOMRResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('evaluation_mode', evaluationMode);
    
    if (studentId) {
      formData.append('student_id', studentId);
    }
    
    if (testData) {
      formData.append('test_data', JSON.stringify(testData));
    }

    return this.makeRequest<BackendOMRResult>('/process-omr', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  /**
   * Get all results with pagination
   */
  async getAllResults(limit: number = 100, offset: number = 0): Promise<{
    results: BackendOMRResult[];
    limit: number;
    offset: number;
  }> {
    return this.makeRequest(`/results?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get results for specific student
   */
  async getStudentResults(studentId: string): Promise<{
    student_id: string;
    results: BackendOMRResult[];
  }> {
    return this.makeRequest(`/results/${studentId}`);
  }

  /**
   * Delete specific result
   */
  async deleteResult(resultId: string): Promise<{ message: string }> {
    return this.makeRequest(`/results/${resultId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Convert backend result to frontend format
   */
  convertBackendResult(backendResult: BackendOMRResult): any {
    return {
      upload_id: backendResult.result_id || `backend_${Date.now()}`,
      student_id: backendResult.student_id,
      filename: `omr_sheet_${backendResult.student_id}.jpg`,
      answers: backendResult.bubble_detections.map(detection => ({
        questionNumber: detection.question_number,
        selectedAnswer: detection.bubble_letter,
        confidence: detection.confidence,
        isCorrect: detection.is_filled, // This would need to be calculated based on answer key
      })),
      scores: {
        Math: backendResult.subject_scores.math,
        'AI/ML': backendResult.subject_scores.ai_ml,
        Stats: backendResult.subject_scores.stats,
        Python: backendResult.subject_scores.python,
        'GenAI': backendResult.subject_scores.genai,
        Total: backendResult.subject_scores.total,
      },
      flagged_questions: backendResult.invalid_questions,
      confidence_score: backendResult.bubble_detections.reduce((acc, d) => acc + d.confidence, 0) / backendResult.bubble_detections.length,
      processing_time: backendResult.processing_metadata.processing_time_ms,
      evaluation_mode: backendResult.processing_metadata.evaluation_mode,
      created_at: backendResult.created_at,
      overlay_image_url: backendResult.overlay_image_url,
    };
  }
}

export const backendApiService = new BackendAPIService();
