import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Supabase Environment Variables:', {
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not set'
});

// Create a mock client if environment variables are not set
let supabase: SupabaseClient | any = null;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key' || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon')) {
  console.warn('Supabase environment variables are not set! Using mock client.');
  // Create a mock client for development
  supabase = {
    from: (table: string) => ({
      select: () => ({ data: [], error: null }),
      insert: (data: any) => {
        // Mock successful insert with generated ID
        const mockData = Array.isArray(data) ? data[0] : data;
        const mockResult = {
          ...mockData,
          id: `mock_${Date.now()}`,
          created_at: new Date().toISOString()
        };
        return { data: [mockResult], error: null };
      },
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      single: () => ({ 
        data: { 
          id: `mock_${Date.now()}`,
          test_name: 'Mock Test',
          description: 'Mock test description',
          total_questions: 100,
          created_at: new Date().toISOString()
        }, 
        error: null 
      }),
      order: () => ({ data: [], error: null })
    }),
    storage: {
      from: () => ({
        upload: () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Database types
export interface TestDetails {
  id?: string;
  test_name: string;
  description: string;
  total_questions: number;
  created_at?: string;
  subjects?: Subject[];
}

export interface Subject {
  id?: string;
  test_id?: string;
  name: string;
  questions: number;
  answer_key: string[];
  created_at?: string;
}

export interface Student {
  id?: string;
  student_id: string;
  name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OMRSheet {
  id?: string;
  test_id: string;
  student_id: string;
  filename: string;
  file_path?: string;
  file_size?: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  evaluation_mode: 'easy' | 'moderate' | 'strict';
  created_at?: string;
  updated_at?: string;
}

export interface Evaluation {
  id?: string;
  sheet_id: string;
  test_id: string;
  student_id: string;
  per_question: any[];
  per_subject_scores: any;
  total_score: number;
  confidence_score: number;
  processing_time: number;
  flags: any;
  created_at?: string;
}

export class SupabaseService {
  private supabase: SupabaseClient | any;

  constructor() {
    this.supabase = supabase;
  }

  // Test Management
  async createTest(testData: Omit<TestDetails, 'id' | 'created_at'>): Promise<TestDetails> {
    try {
      console.log('Creating test with data:', testData);
      console.log('Supabase client:', this.supabase);
      console.log('Environment variables:', {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
      });

      const { data, error } = await this.supabase
        .from('tests')
        .insert([testData])
        .select()
        .single();

      console.log('Test creation result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from database');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  async getTests(): Promise<TestDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('tests')
        .select(`
          *,
          subjects (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tests:', error);
      return [];
    }
  }

  async getTestById(testId: string): Promise<TestDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from('tests')
        .select(`
          *,
          subjects (*)
        `)
        .eq('id', testId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching test:', error);
      return null;
    }
  }

  // Subject Management
  async createSubject(subjectData: Omit<Subject, 'id' | 'created_at'>): Promise<Subject> {
    try {
      const { data, error } = await this.supabase
        .from('subjects')
        .insert([subjectData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  // Student Management
  async createStudent(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    try {
      const { data, error } = await this.supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const { data, error } = await this.supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  }

  async getStudents(): Promise<Student[]> {
    try {
      const { data, error } = await this.supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  // OMR Sheet Management
  async createOMRSheet(sheetData: Omit<OMRSheet, 'id' | 'created_at' | 'updated_at'>): Promise<OMRSheet> {
    try {
      const { data, error } = await this.supabase
        .from('omr_sheets')
        .insert([sheetData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating OMR sheet:', error);
      throw error;
    }
  }

  async updateOMRSheetStatus(sheetId: string, status: OMRSheet['status']): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('omr_sheets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sheetId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating OMR sheet status:', error);
      throw error;
    }
  }

  // Evaluation Management
  async createEvaluation(evaluationData: Omit<Evaluation, 'id' | 'created_at'>): Promise<Evaluation> {
    try {
      const { data, error } = await this.supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating evaluation:', error);
      throw error;
    }
  }

  async getEvaluationsByStudent(studentId: string): Promise<Evaluation[]> {
    try {
      const { data, error } = await this.supabase
        .from('evaluations')
        .select(`
          *,
          omr_sheets (
            filename,
            test_id,
            tests (test_name)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return [];
    }
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    try {
      const { data, error } = await this.supabase
        .from('evaluations')
        .select(`
          *,
          omr_sheets (
            filename,
            test_id,
            tests (test_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return [];
    }
  }

  // File Upload
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('omr-images')
        .upload(path, file);

      if (error) throw error;
      
      const { data: urlData } = this.supabase.storage
        .from('omr-images')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const { data, error } = await this.supabase
        .from('tests')
        .select('count')
        .limit(1);

      if (error) throw error;
      return { status: 'connected', message: 'Supabase connection successful' };
    } catch (error) {
      return { status: 'error', message: `Supabase connection failed: ${error}` };
    }
  }
}

export const supabaseService = new SupabaseService();
