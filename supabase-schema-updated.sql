-- Updated Supabase Schema for OMR Evaluation System
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    total_questions INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'system'
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    questions INTEGER NOT NULL,
    answer_key JSONB NOT NULL, -- Array of correct answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create omr_sheets table
CREATE TABLE IF NOT EXISTS omr_sheets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    student_id VARCHAR(255) REFERENCES students(student_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, completed, failed
    evaluation_mode VARCHAR(20) DEFAULT 'moderate', -- easy, moderate, strict
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sheet_id UUID REFERENCES omr_sheets(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    student_id VARCHAR(255) REFERENCES students(student_id) ON DELETE CASCADE,
    per_question JSONB NOT NULL, -- Array of question answers and confidence
    per_subject_scores JSONB NOT NULL, -- Subject-wise scores
    total_score INTEGER NOT NULL DEFAULT 0,
    confidence_score DECIMAL(5,4) DEFAULT 0.0,
    processing_time INTEGER DEFAULT 0, -- in milliseconds
    flags JSONB DEFAULT '{}', -- Flags for invalid questions, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flagged_answers table
CREATE TABLE IF NOT EXISTS flagged_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    original_choice VARCHAR(10),
    confidence DECIMAL(5,4),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at);
CREATE INDEX IF NOT EXISTS idx_subjects_test_id ON subjects(test_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_omr_sheets_test_id ON omr_sheets(test_id);
CREATE INDEX IF NOT EXISTS idx_omr_sheets_student_id ON omr_sheets(student_id);
CREATE INDEX IF NOT EXISTS idx_omr_sheets_status ON omr_sheets(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_sheet_id ON evaluations(sheet_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_flagged_answers_evaluation_id ON flagged_answers(evaluation_id);

-- Create storage bucket for OMR images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('omr-images', 'omr-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE omr_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on tests" ON tests FOR ALL USING (true);
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations on omr_sheets" ON omr_sheets FOR ALL USING (true);
CREATE POLICY "Allow all operations on evaluations" ON evaluations FOR ALL USING (true);
CREATE POLICY "Allow all operations on flagged_answers" ON flagged_answers FOR ALL USING (true);
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL USING (true);

-- Create storage policies
CREATE POLICY "Allow public access to omr-images" ON storage.objects FOR SELECT USING (bucket_id = 'omr-images');
CREATE POLICY "Allow uploads to omr-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'omr-images');
CREATE POLICY "Allow updates to omr-images" ON storage.objects FOR UPDATE USING (bucket_id = 'omr-images');
CREATE POLICY "Allow deletes to omr-images" ON storage.objects FOR DELETE USING (bucket_id = 'omr-images');

-- Insert a default test for testing
INSERT INTO tests (test_name, description, total_questions, created_by) 
VALUES ('Sample Test', 'A sample test for OMR evaluation', 100, 'system')
ON CONFLICT DO NOTHING;

-- Get the test ID for inserting subjects
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    SELECT id INTO test_uuid FROM tests WHERE test_name = 'Sample Test' LIMIT 1;
    
    -- Insert subjects for the sample test
    INSERT INTO subjects (test_id, name, questions, answer_key) VALUES
    (test_uuid, 'Mathematics', 25, '["A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A"]'),
    (test_uuid, 'Physics', 25, '["B","C","A","D","B","C","A","D","B","C","A","D","B","C","A","D","B","C","A","D","B","C","A","D","B"]'),
    (test_uuid, 'Chemistry', 25, '["C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C"]'),
    (test_uuid, 'Biology', 25, '["D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D","A","B","C","D"]')
    ON CONFLICT DO NOTHING;
END $$;
