import React, { useState, useCallback, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from '@/hooks/use-toast';

// Components
import Sidebar from '@/components/layout/Sidebar';
import CreateTestPage from '@/pages/test/CreateTestPage';
import UploadPage from '@/pages/upload/UploadPage';
import ProcessingPage from '@/pages/dashboard/ProcessingPage';
import ResultsPage from '@/pages/results/ResultsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import StudentIdentificationDialog from '@/components/features/StudentIdentificationDialog';

// Services and Types
import { mockAPI } from '@/services/api';
import { supabaseService, TestDetails, Subject, Student, OMRSheet, Evaluation } from '@/services/supabaseService';
import { OMRResult, Upload, AppSettings, TabId, AuditLogEntry, ProcessingItem, EvaluationMode } from '@/types';
import { DEFAULT_SETTINGS, DEMO_SCRIPT_STEPS } from '@/constants';
import { omrProcessor } from '@/services/omrProcessor';

// Modals
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BookOpen, Target } from 'lucide-react';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('upload');
  const [uploads, setUploads] = useState<ProcessingItem[]>([]);
  const [results, setResults] = useState<OMRResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OMRResult | null>(null);
  const [currentTest, setCurrentTest] = useState<TestDetails | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('moderate');

      // Initialize with data from Supabase or localStorage
      useEffect(() => {
        const initializeApp = async () => {
          try {
            // Check if Supabase is properly configured
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key' || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon')) {
              // Fallback: Load from localStorage
              console.warn('Supabase not configured, loading from localStorage');
              const savedTest = localStorage.getItem('currentTest');
              if (savedTest) {
                const test = JSON.parse(savedTest);
                setCurrentTest(test);
                console.log('Loaded test from localStorage:', test);
              }
              return;
            }

            // Load tests from Supabase
            const tests = await supabaseService.getTests();
            console.log('Loaded tests from Supabase:', tests);
            
            if (tests.length > 0) {
              // Convert Supabase format to frontend format
              const test = tests[0];
              const frontendTest: TestDetails = {
                id: test.id,
                test_name: test.test_name,
                description: test.description,
                total_questions: test.total_questions,
                subjects: test.subjects?.map((subject: any) => ({
                  id: subject.id,
                  name: subject.name,
                  questions: subject.questions,
                  answer_key: subject.answer_key
                })) || []
              };
              setCurrentTest(frontendTest);
              console.log('Set current test:', frontendTest);
            } else {
              console.log('No tests found in Supabase');
            }
            
            // Load evaluations as results
            const evaluations = await supabaseService.getAllEvaluations();
            console.log('Loaded evaluations from Supabase:', evaluations);
            
            // Convert evaluations to OMR results format
            const results = evaluations.map((evaluation: Evaluation) => ({
              upload_id: evaluation.id || '',
              student_id: evaluation.student_id,
              filename: `evaluation_${evaluation.id}`,
              answers: evaluation.per_question || [],
              scores: evaluation.per_subject_scores || {},
              flagged_questions: evaluation.flags?.ambiguous_questions || [],
              confidence_score: evaluation.confidence_score,
              processing_time: evaluation.processing_time,
              evaluation_mode: 'moderate' as EvaluationMode,
              created_at: evaluation.created_at || new Date().toISOString()
            }));
            
            setResults(results);
            console.log('Set results:', results);
            
          } catch (error) {
            console.error('Error initializing app:', error);
            
            // Fallback to localStorage on error
            console.warn('Falling back to localStorage due to error:', error);
            const savedTest = localStorage.getItem('currentTest');
            if (savedTest) {
              const test = JSON.parse(savedTest);
              setCurrentTest(test);
              console.log('Loaded test from localStorage fallback:', test);
            }
            
            toast({
              title: "Database Error",
              description: "Using local storage fallback. Check Supabase configuration.",
              variant: "destructive"
            });
          }
        };

        initializeApp();
      }, []);

  // File Upload Handler
  const handleFileUpload = useCallback(async (files: FileList, mode: EvaluationMode = 'moderate') => {
    if (!currentTest) {
      toast({ 
        title: "No Test Selected", 
        description: "Please create a test first before uploading OMR sheets", 
        variant: "destructive" 
      });
      return;
    }

    // Handle single file upload with student identification
    const file = files[0];
    if (!file) {
      return;
    }

    console.log('Setting pending file and showing student dialog:', file.name);
    setPendingFile(file);
    setShowStudentDialog(true);
  }, [currentTest]);

  // Test Management Handlers
  const handleTestCreated = useCallback(async (testDetails: TestDetails) => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key' || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon')) {
        // Fallback: Use local storage if Supabase is not configured
        console.warn('Supabase not configured, using local storage fallback');
        const testId = `local_${Date.now()}`;
        const testWithId = { ...testDetails, id: testId };
        
        // Save to localStorage as fallback
        localStorage.setItem('currentTest', JSON.stringify(testWithId));
        localStorage.setItem('testSubjects', JSON.stringify(testDetails.subjects || []));
        
        setCurrentTest(testWithId);
        setActiveTab('upload');
        toast({ 
        title: "Test Created (Local Storage)", 
        description: `Test "${testDetails.test_name}" saved locally. To use Supabase, create .env.local file with your credentials.`
        });
        return;
      }

      // Save test to Supabase
      const testData = {
        test_name: testDetails.test_name,
        description: testDetails.description,
        total_questions: testDetails.total_questions
      };
      
      const savedTest = await supabaseService.createTest(testData);
      console.log('Test saved to Supabase:', savedTest);
      
      // Save subjects to Supabase
      if (testDetails.subjects && savedTest.id) {
        for (const subject of testDetails.subjects) {
          await supabaseService.createSubject({
            test_id: savedTest.id,
            name: subject.name,
            questions: subject.questions,
            answer_key: subject.answer_key
          });
        }
      }
      
      // Update testDetails with the saved ID
      const updatedTestDetails = {
        ...testDetails,
        id: savedTest.id
      };
      
      setCurrentTest(updatedTestDetails);
      setActiveTab('upload');
      toast({ title: "Test Created", description: `Test "${testDetails.test_name}" has been saved and is ready for evaluation` });
    } catch (error) {
      console.error('Error creating test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Fallback to local storage on error
      console.warn('Falling back to local storage due to error:', errorMessage);
      const testId = `local_${Date.now()}`;
      const testWithId = { ...testDetails, id: testId };
      
      localStorage.setItem('currentTest', JSON.stringify(testWithId));
      localStorage.setItem('testSubjects', JSON.stringify(testDetails.subjects || []));
      
      setCurrentTest(testWithId);
      setActiveTab('upload');
      toast({ 
        title: "Test Created (Local Storage)", 
        description: `Test "${testDetails.test_name}" saved locally. Database error: ${errorMessage}` 
      });
    }
  }, []);

  const handleStartEvaluating = useCallback((testDetails: TestDetails) => {
    setCurrentTest(testDetails);
    setActiveTab('upload');
    toast({ title: "Ready to Evaluate", description: `Test "${testDetails.test_name}" is ready for evaluation` });
  }, []);

  const handleStudentIdentified = useCallback(async (studentName: string, studentId: string) => {
    console.log('Student identified:', { studentName, studentId, pendingFile: pendingFile?.name, currentTest: currentTest?.test_name });
    
    if (!pendingFile || !currentTest) {
      console.error('Missing pendingFile or currentTest:', { pendingFile: !!pendingFile, currentTest: !!currentTest });
      return;
    }

    setShowStudentDialog(false);
    
    try {
      // Create or get student in Supabase
      let student = await supabaseService.getStudentById(studentId);
      if (!student) {
        student = await supabaseService.createStudent({
          student_id: studentId,
          name: studentName
        });
        console.log('Student created in Supabase:', student);
      } else {
        console.log('Student found in Supabase:', student);
      }
    } catch (error) {
      console.error('Error handling student:', error);
      toast({
        title: "Error",
        description: "Failed to save student information",
        variant: "destructive"
      });
      return;
    }
    
    // Create new upload with student info
    const newUpload: ProcessingItem = {
      id: Date.now().toString(),
      filename: pendingFile.name,
      size: pendingFile.size,
      status: 'processing',
      progress: 0,
      startTime: Date.now(),
      evaluationMode: evaluationMode
    };

    setUploads(prev => [...prev, newUpload]);

    try {
      console.log('Starting OMR processing...', { evaluationMode, fileName: pendingFile.name });
      
      // Update progress to show processing has started
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 10, status: 'processing' }
          : upload
      ));
      
      // Set evaluation mode
      omrProcessor.setEvaluationMode(evaluationMode);
      
      // Update progress to show processing is in progress
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 50, status: 'processing' }
          : upload
      ));
      
      // Process with student info and answer key
      const testData = currentTest ? {
        subjects: currentTest.subjects || [],
        answerKey: (currentTest.subjects || []).flatMap(subject => subject.answer_key)
      } : undefined;
      
      const result = await omrProcessor.processOMRSheet(pendingFile, testData);
      
      console.log('OMR processing result:', result);
      
      if (!result) {
        throw new Error('No result returned from OMR processor');
      }

      if (result.success && result.data) {
        // Update upload status
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id 
            ? { ...upload, status: 'completed', progress: 100, endTime: Date.now() }
            : upload
        ));

        try {
          // Update progress to show database saving
          setUploads(prev => prev.map(upload => 
            upload.id === newUpload.id 
              ? { ...upload, progress: 80, status: 'processing' }
              : upload
          ));
          
          // Save OMR sheet to Supabase
          const omrSheet = await supabaseService.createOMRSheet({
            test_id: currentTest.id || 'default',
            student_id: studentId,
            filename: pendingFile.name,
            file_path: `uploads/${Date.now()}-${pendingFile.name}`,
            file_size: pendingFile.size,
            status: 'completed',
            evaluation_mode: evaluationMode
          });
          console.log('OMR sheet saved to Supabase:', omrSheet);

          // Save evaluation to Supabase
          const evaluation = await supabaseService.createEvaluation({
            sheet_id: omrSheet.id || '',
            test_id: currentTest.id || 'default',
            student_id: studentId,
            per_question: result.data.answers,
            per_subject_scores: result.data.scores,
            total_score: Object.values(result.data.scores).reduce((sum: number, score: any) => sum + (typeof score === 'number' ? score : 0), 0),
            confidence_score: result.data.confidence,
            processing_time: result.data.processingTime,
            flags: {
              ambiguous_questions: result.data.flaggedQuestions,
              low_confidence: result.data.flaggedQuestions
            }
          });
          console.log('Evaluation saved to Supabase:', evaluation);

          // Add to results
          const omrResult: OMRResult = {
            upload_id: newUpload.id,
            student_id: studentId,
            filename: pendingFile.name,
            answers: result.data.answers,
            scores: result.data.scores,
            flagged_questions: result.data.flaggedQuestions,
            confidence_score: result.data.confidence,
            processing_time: result.data.processingTime,
            evaluation_mode: evaluationMode,
            created_at: new Date().toISOString()
          };
          setResults(prev => [...prev, omrResult]);
          setActiveTab('results');
          
          toast({ 
            title: "Processing Complete", 
            description: `OMR sheet processed for ${studentName} (${studentId})` 
          });
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          toast({
            title: "Warning",
            description: "Processing completed but failed to save to database",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      console.error('Error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fileName: pendingFile.name
      });
      
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, status: 'failed', progress: 0, endTime: Date.now() }
          : upload
      ));
      toast({ 
        title: "Processing Failed", 
        description: `Failed to process ${pendingFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        variant: "destructive" 
      });
    }

    setPendingFile(null);
  }, [pendingFile, currentTest, evaluationMode]);

  // Processing Queue Handlers
  const handleViewResult = useCallback((upload: ProcessingItem) => {
    // Find the result for this upload
    const result = results.find(r => r.upload_id === upload.id);
    if (result) {
      setSelectedResult(result);
      setActiveTab('results');
    }
  }, [results]);

  const handleRetry = useCallback(async (upload: ProcessingItem) => {
    // Reset upload status and retry processing
    setUploads(prev => prev.map(u => 
      u.id === upload.id 
        ? { ...u, status: 'processing', progress: 0, startTime: Date.now() }
        : u
    ));
    
    // Here you would retry the actual processing
    toast({ title: "Retrying", description: `Retrying processing for ${upload.filename}` });
  }, []);

  const handleCancel = useCallback((upload: ProcessingItem) => {
    // Cancel processing
    setUploads(prev => prev.map(u => 
      u.id === upload.id 
        ? { ...u, status: 'failed', progress: 0, endTime: Date.now() }
        : u
    ));
    toast({ title: "Cancelled", description: `Processing cancelled for ${upload.filename}` });
  }, []);

  const handleRemove = useCallback((upload: ProcessingItem) => {
    // Remove from uploads list
    setUploads(prev => prev.filter(u => u.id !== upload.id));
    toast({ title: "Removed", description: `Removed ${upload.filename} from queue` });
  }, []);

  // Question Correction Handler
  const handleQuestionCorrection = useCallback(async (qIdx: number, newChoice: string) => {
    if (!selectedResult) return;

    const corrections = [{
      question_id: qIdx,
      old_choice: selectedResult.answers.find(q => q.questionNumber === qIdx)?.selectedAnswer,
      new_choice: newChoice,
      timestamp: new Date().toISOString(),
      user_id: 'demo_user'
    }];

    try {
      const updatedResult = await mockAPI.correctResult(selectedResult.upload_id, corrections);
      setSelectedResult(updatedResult);
      toast({ title: "Correction saved", description: `Question ${qIdx} updated to ${newChoice}` });
    } catch (error) {
      toast({ title: "Save failed", description: "Failed to save correction", variant: "destructive" });
    }
  }, [selectedResult]);


  const handleReviewResult = (result: OMRResult) => {
    setSelectedResult(result);
    setActiveTab('results');
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'create-test':
        return (
          <CreateTestPage 
            onTestCreated={handleTestCreated}
            onStartEvaluating={handleStartEvaluating}
          />
        );
      case 'upload':
        return (
          <UploadPage 
            onFileUpload={handleFileUpload} 
            uploads={uploads} 
            currentTest={currentTest}
          />
        );
      case 'processing':
        return (
          <ProcessingPage 
            uploads={uploads}
            onViewResult={handleViewResult}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onRemove={handleRemove}
          />
        );
      case 'results':
        return <ResultsPage results={results} onReviewResult={handleReviewResult} />;
      case 'reports':
        return <ReportsPage results={results} />;
      default:
        return <div className="text-center text-muted-foreground">Page not found</div>;
    }
  };

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <div className="min-h-screen bg-background">

                {/* Main Interface */}
                <div className="flex h-screen">
                  <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />

                  {/* Main Content */}
                  <div className="flex-1 overflow-auto">
                    <div className="p-6">
                      {renderContent()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Identification Dialog */}
              <StudentIdentificationDialog
                isOpen={showStudentDialog}
                onClose={() => setShowStudentDialog(false)}
                onConfirm={handleStudentIdentified}
                filename={pendingFile?.name || ''}
              />

              {/* Custom Footer */}
              <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-2 text-center text-sm text-muted-foreground z-50">
                <div className="flex items-center justify-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>OMR Vision System - Advanced OMR Evaluation Platform</span>
                </div>
              </footer>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;