// OMR Result Types
export interface OMRResult {
  upload_id: string;
  student_id: string;
  filename: string;
  answers: AnswerData[];
  scores: SubjectScores;
  flagged_questions: number[];
  confidence_score: number;
  processing_time: number;
  evaluation_mode: EvaluationMode;
  created_at: string;
}

export interface QuestionResult {
  q_idx: number;
  choice: string;
  confidence: number;
  features: {
    mean_intensity: number;
    dark_ratio: number;
  };
}

export interface AnswerData {
  questionNumber: number;
  selectedAnswer: string;
  confidence: number;
  isCorrect?: boolean;
}

export interface SubjectScores {
  Physics: number;
  Math: number;
  English: number;
  Total: number;
}

export interface Flags {
  no_fiducials: boolean;
  ambiguous_questions: number[];
  low_confidence: number[];
}

export interface Artifacts {
  original_url: string;
  warped_url: string;
  overlay_url: string;
}

// Upload Types
export interface Upload {
  upload_id: string;
  filename: string;
  size: number;
  status: string;
  progress: number;
  startTime: number;
}

// Processing Types
export interface ProcessingItem {
  id: string;
  filename: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  evaluationMode: EvaluationMode;
}

export type EvaluationMode = 'easy' | 'moderate' | 'strict';

// Test Configuration Types
export interface Subject {
  id?: string;
  name: string;
  questions: number;
  answer_key: string[];
}

export interface TestDetails {
  test_name: string;
  description: string;
  total_questions: number;
  subjects?: Subject[];
  created_at?: string;
  id?: string;
}

// API Response Types
export interface UploadResponse {
  upload_id: string;
  status: string;
}

export interface UploadStatusResponse {
  status: string;
  progress?: number;
}

export interface ExportResponse {
  download_url: string;
}

export interface LLMExplanationResponse {
  explanation: string;
  recommended_action: string;
  severity: string;
}

// UI State Types
export interface AppSettings {
  TH_LOW: number;
  TH_HIGH: number;
  flag_rate_target: number;
  use_mock_llm: boolean;
}

export interface AuditLogEntry {
  question_id: number;
  old_choice: string;
  new_choice: string;
  timestamp: string;
  user_id: string;
}

// Navigation Types
export type TabId = 'create-test' | 'upload' | 'processing' | 'results' | 'reports';
