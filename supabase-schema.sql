-- OMR Evaluation System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OMR Sheets table
CREATE TABLE omr_sheets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    upload_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    evaluation_mode VARCHAR(20) DEFAULT 'moderate' CHECK (evaluation_mode IN ('easy', 'moderate', 'strict')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sheet_id UUID REFERENCES omr_sheets(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    per_question JSONB NOT NULL,
    per_subject_scores JSONB NOT NULL,
    flags JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    processing_time INTEGER NOT NULL, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flagged Answers table
CREATE TABLE flagged_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    original_choice VARCHAR(10) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'corrected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    old_choice VARCHAR(10) NOT NULL,
    new_choice VARCHAR(10) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_omr_sheets_student_id ON omr_sheets(student_id);
CREATE INDEX idx_omr_sheets_status ON omr_sheets(status);
CREATE INDEX idx_omr_sheets_created_at ON omr_sheets(created_at);

CREATE INDEX idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX idx_evaluations_sheet_id ON evaluations(sheet_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at);

CREATE INDEX idx_flagged_answers_evaluation_id ON flagged_answers(evaluation_id);
CREATE INDEX idx_flagged_answers_status ON flagged_answers(status);

CREATE INDEX idx_audit_logs_evaluation_id ON audit_logs(evaluation_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_omr_sheets_updated_at BEFORE UPDATE ON omr_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flagged_answers_updated_at BEFORE UPDATE ON flagged_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for OMR sheets
INSERT INTO storage.buckets (id, name, public) VALUES ('omr-sheets', 'omr-sheets', true);

-- Set up Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE omr_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow all operations (you can restrict later)
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations on omr_sheets" ON omr_sheets FOR ALL USING (true);
CREATE POLICY "Allow all operations on evaluations" ON evaluations FOR ALL USING (true);
CREATE POLICY "Allow all operations on flagged_answers" ON flagged_answers FOR ALL USING (true);
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL USING (true);

-- Insert some sample data
INSERT INTO students (student_id, name, class) VALUES
('S2025_001', 'John Doe', 'Grade 10'),
('S2025_002', 'Jane Smith', 'Grade 10'),
('S2025_003', 'Mike Johnson', 'Grade 11');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
