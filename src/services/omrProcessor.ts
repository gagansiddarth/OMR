// OMR Processing Service
// This will handle the core OMR scanning and evaluation logic

import { DatabaseService } from '@/lib/supabase';
import { backendApiService } from './backendApi';

export interface OMRProcessingResult {
  success: boolean;
  data?: {
    studentId: string;
    answers: AnswerData[];
    scores: SubjectScores;
    confidence: number;
    flaggedQuestions: number[];
    processingTime: number;
  };
  error?: string;
}

export interface AnswerData {
  questionNumber: number;
  selectedAnswer: string;
  confidence: number;
  isFlagged: boolean;
  fillRatio: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SubjectScores {
  Physics: number;
  Math: number;
  English: number;
  Total: number;
}

export interface EvaluationMode {
  mode: 'easy' | 'moderate' | 'strict';
  tolerance: number;
  confidenceThreshold: number;
}

// Mock OMR Processing Service
export class OMRProcessor {
  private evaluationMode: EvaluationMode = {
    mode: 'moderate',
    tolerance: 0.2,
    confidenceThreshold: 0.6
  };

  constructor() {
    this.setEvaluationMode = this.setEvaluationMode.bind(this);
  }

  setEvaluationMode(mode: 'easy' | 'moderate' | 'strict') {
    switch (mode) {
      case 'easy':
        this.evaluationMode = {
          mode: 'easy',
          tolerance: 0.15, // 15% tolerance
          confidenceThreshold: 0.4
        };
        break;
      case 'moderate':
        this.evaluationMode = {
          mode: 'moderate',
          tolerance: 0.1, // 10% tolerance
          confidenceThreshold: 0.6
        };
        break;
      case 'strict':
        this.evaluationMode = {
          mode: 'strict',
          tolerance: 0.05, // 5% tolerance
          confidenceThreshold: 0.8
        };
        break;
    }
  }

  async processOMRSheet(file: File, testData?: { subjects: any[], answerKey: string[] }): Promise<OMRProcessingResult> {
    try {
      console.log('Starting OMR processing with backend API...', {
        fileName: file.name,
        fileSize: file.size,
        evaluationMode: this.evaluationMode.mode,
        studentId: this.extractStudentId(file.name)
      });
      
      // Check if backend is available first
      try {
        const healthCheck = await backendApiService.healthCheck();
        console.log('Backend health check:', healthCheck);
        console.log('Backend is available, proceeding with real OMR processing');
      } catch (healthError) {
        console.warn('Backend health check failed, using mock processing:', healthError);
        console.log('Falling back to mock processing due to backend unavailability');
        return this.mockProcessOMRSheet(file);
      }
      
      // Use backend API for real OMR processing
      console.log('Calling backend API for OMR processing...');
      const backendResult = await backendApiService.processOMRSheet(
        file, 
        this.evaluationMode.mode as 'easy' | 'moderate' | 'strict',
        this.extractStudentId(file.name),
        testData
      );
      
      console.log('Backend processing completed:', backendResult);
      console.log('Backend result success:', backendResult.success);
      console.log('Backend bubbles detected:', backendResult.bubble_detections?.length || 0);
      
      if (backendResult.success) {
        console.log('Converting backend result to frontend format...');
        const frontendResult = backendApiService.convertBackendResult(backendResult);
        console.log('Frontend result:', frontendResult);
        
        // Save to database
        try {
          const filePath = `uploads/${Date.now()}-${file.name}`;
          await DatabaseService.uploadFile(file, filePath);
          
          const sheet = await DatabaseService.createSheet({
            upload_id: backendResult.result_id || `backend_${Date.now()}`,
            student_id: backendResult.student_id,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            status: 'completed',
            evaluation_mode: this.evaluationMode.mode
          });
          
          const evaluation = await DatabaseService.createEvaluation({
            sheet_id: sheet.id,
            student_id: backendResult.student_id,
            per_question: frontendResult.answers,
            per_subject_scores: frontendResult.scores,
            flags: {
              no_fiducials: false,
              ambiguous_questions: backendResult.invalid_questions,
              low_confidence: backendResult.invalid_questions
            },
            confidence_score: frontendResult.confidence_score,
            processing_time: backendResult.processing_metadata.processing_time_ms
          });
          
          // Create flagged answers records
          for (const questionNumber of backendResult.invalid_questions) {
            const answer = frontendResult.answers.find(a => a.questionNumber === questionNumber);
            if (answer) {
              await DatabaseService.createFlaggedAnswer({
                evaluation_id: evaluation.id,
                question_number: questionNumber,
                original_choice: answer.selectedAnswer,
                confidence: answer.confidence,
                reason: `Invalid question detected in ${this.evaluationMode.mode} mode`,
                status: 'pending'
              });
            }
          }
        } catch (dbError) {
          console.warn('Database save failed, but processing will continue:', dbError);
        }
        
        return {
          success: true,
          data: {
            studentId: backendResult.student_id,
            answers: frontendResult.answers,
            scores: frontendResult.scores,
            confidence: frontendResult.confidence_score,
            flaggedQuestions: backendResult.invalid_questions,
            processingTime: backendResult.processing_metadata.processing_time_ms
          }
        };
      } else {
        throw new Error('Backend processing failed');
      }
    } catch (error) {
      console.error('OMR processing failed:', error);
      console.warn('Falling back to mock processing due to error:', error);
      return this.mockProcessOMRSheet(file);
    }
  }

  private async mockProcessOMRSheet(file: File): Promise<OMRProcessingResult> {
    console.log('Using mock OMR processing for file:', file.name);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock data
    const mockAnswers: AnswerData[] = [];
    const totalQuestions = 100;
    
    for (let i = 1; i <= totalQuestions; i++) {
      const choices = ['A', 'B', 'C', 'D'];
      const selectedAnswer = choices[Math.floor(Math.random() * choices.length)];
      const confidence = 0.7 + Math.random() * 0.3; // 0.7 to 1.0
      
      mockAnswers.push({
        questionNumber: i,
        selectedAnswer,
        confidence,
        isFlagged: confidence < 0.8,
        fillRatio: 0.8 + Math.random() * 0.2,
        boundingBox: {
          x: Math.random() * 100,
          y: Math.random() * 100,
          width: 20,
          height: 20
        }
      });
    }
    
    // Calculate mock scores
    const correctAnswers = mockAnswers.filter(a => a.confidence > 0.8).length;
    const physicsScore = Math.floor(correctAnswers * 0.25);
    const mathScore = Math.floor(correctAnswers * 0.25);
    const englishScore = Math.floor(correctAnswers * 0.25);
    const totalScore = physicsScore + mathScore + englishScore;
    
    const scores: SubjectScores = {
      Physics: physicsScore,
      Math: mathScore,
      English: englishScore,
      Total: totalScore
    };
    
    const flaggedQuestions = mockAnswers
      .filter(a => a.isFlagged)
      .map(a => a.questionNumber);
    
    return {
      success: true,
      data: {
        studentId: this.extractStudentId(file.name),
        answers: mockAnswers,
        scores,
        confidence: 0.85,
        flaggedQuestions,
        processingTime: 2000
      }
    };
  }


  private extractStudentId(filename: string): string {
    // Extract student ID from filename or generate one
    const match = filename.match(/(\d+)/);
    return match ? `S2025_${match[1].padStart(3, '0')}` : `S2025_${Date.now()}`;
  }

  // Get current evaluation mode
  getEvaluationMode(): EvaluationMode {
    return { ...this.evaluationMode };
  }

  // Process multiple sheets
  async processMultipleSheets(files: File[]): Promise<OMRProcessingResult[]> {
    const results: OMRProcessingResult[] = [];
    
    for (const file of files) {
      const result = await this.processOMRSheet(file);
      results.push(result);
    }
    
    return results;
  }
}

// Export singleton instance
export const omrProcessor = new OMRProcessor();
