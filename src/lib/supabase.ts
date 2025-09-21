import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set
let supabase: any = null;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.warn('Supabase environment variables are not set! Using mock client.');
  // Create a mock client for development
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
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

export { supabase };

// Database types
export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          class: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          class: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          class?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      omr_sheets: {
        Row: {
          id: string;
          upload_id: string;
          student_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          status: 'uploading' | 'processing' | 'completed' | 'failed';
          evaluation_mode: 'easy' | 'moderate' | 'strict';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          student_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          status?: 'uploading' | 'processing' | 'completed' | 'failed';
          evaluation_mode: 'easy' | 'moderate' | 'strict';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          upload_id?: string;
          student_id?: string;
          filename?: string;
          file_path?: string;
          file_size?: number;
          status?: 'uploading' | 'processing' | 'completed' | 'failed';
          evaluation_mode?: 'easy' | 'moderate' | 'strict';
          created_at?: string;
          updated_at?: string;
        };
      };
      evaluations: {
        Row: {
          id: string;
          sheet_id: string;
          student_id: string;
          per_question: any; // JSON
          per_subject_scores: any; // JSON
          flags: any; // JSON
          confidence_score: number;
          processing_time: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          student_id: string;
          per_question: any;
          per_subject_scores: any;
          flags: any;
          confidence_score: number;
          processing_time: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sheet_id?: string;
          student_id?: string;
          per_question?: any;
          per_subject_scores?: any;
          flags?: any;
          confidence_score?: number;
          processing_time?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      flagged_answers: {
        Row: {
          id: string;
          evaluation_id: string;
          question_number: number;
          original_choice: string;
          confidence: number;
          reason: string;
          status: 'pending' | 'reviewed' | 'corrected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evaluation_id: string;
          question_number: number;
          original_choice: string;
          confidence: number;
          reason: string;
          status?: 'pending' | 'reviewed' | 'corrected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evaluation_id?: string;
          question_number?: number;
          original_choice?: string;
          confidence?: number;
          reason?: string;
          status?: 'pending' | 'reviewed' | 'corrected';
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          evaluation_id: string;
          question_number: number;
          old_choice: string;
          new_choice: string;
          user_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          evaluation_id: string;
          question_number: number;
          old_choice: string;
          new_choice: string;
          user_id: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          evaluation_id?: string;
          question_number?: number;
          old_choice?: string;
          new_choice?: string;
          user_id?: string;
          reason?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Database service functions
export class DatabaseService {
  // Students
  static async getStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createStudent(student: Database['public']['Tables']['students']['Insert']) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // OMR Sheets
  static async getSheets() {
    const { data, error } = await supabase
      .from('omr_sheets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createSheet(sheet: Database['public']['Tables']['omr_sheets']['Insert']) {
    const { data, error } = await supabase
      .from('omr_sheets')
      .insert(sheet)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateSheetStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('omr_sheets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Evaluations
  static async getEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        omr_sheets!inner(filename, student_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createEvaluation(evaluation: Database['public']['Tables']['evaluations']['Insert']) {
    const { data, error } = await supabase
      .from('evaluations')
      .insert(evaluation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateEvaluation(id: string, updates: Partial<Database['public']['Tables']['evaluations']['Update']>) {
    const { data, error } = await supabase
      .from('evaluations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Flagged Answers
  static async getFlaggedAnswers() {
    const { data, error } = await supabase
      .from('flagged_answers')
      .select(`
        *,
        evaluations!inner(omr_sheets!inner(filename, student_id))
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createFlaggedAnswer(flaggedAnswer: Database['public']['Tables']['flagged_answers']['Insert']) {
    const { data, error } = await supabase
      .from('flagged_answers')
      .insert(flaggedAnswer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Audit Logs
  static async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createAuditLog(auditLog: Database['public']['Tables']['audit_logs']['Insert']) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(auditLog)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // File Upload
  static async uploadFile(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('omr-sheets')
      .upload(path, file);
    
    if (error) throw error;
    return data;
  }

  static async getFileUrl(path: string) {
    const { data } = supabase.storage
      .from('omr-sheets')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}
