import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from '@/hooks/use-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Components
import Sidebar from '@/components/layout/Sidebar';
import CreateTestPage from '@/pages/test/CreateTestPage';
import UploadPage from '@/pages/upload/UploadPage';
import ProcessingPage from '@/pages/dashboard/ProcessingPage';
import ResultsPage from '@/pages/results/ResultsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import StudentIdentificationDialog from '@/components/features/StudentIdentificationDialog';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

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
  const [activeTab, setActiveTab] = useState<TabId>('create-test');
  const [uploads, setUploads] = useState<ProcessingItem[]>([]);
  const [results, setResults] = useState<OMRResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OMRResult | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTest, setCurrentTest] = useState<TestDetails | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('moderate');

  // Initialize with data from Supabase or localStorage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load test details from localStorage
        const savedTest = localStorage.getItem('currentTest');
        if (savedTest) {
          setCurrentTest(JSON.parse(savedTest));
        }

        // Load results from localStorage
        const savedResults = localStorage.getItem('omrResults');
        if (savedResults) {
          setResults(JSON.parse(savedResults));
        }

        // Load uploads from localStorage
        const savedUploads = localStorage.getItem('omrUploads');
        if (savedUploads) {
          setUploads(JSON.parse(savedUploads));
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  const handleFileUpload = useCallback(async (files: FileList, mode: EvaluationMode) => {
    console.log('App: handleFileUpload called with files:', files.length, 'mode:', mode);
    
    const newUploads: ProcessingItem[] = Array.from(files).map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      filename: file.name,
      status: 'processing',
      progress: 0,
      uploadedAt: new Date().toISOString(),
      mode,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        // Update progress
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: 25 }
            : upload
        ));

        // Process the file
        const result = await omrProcessor.processOMRSheet(file, mode, currentTest);
        
        // Update progress
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: 75 }
            : upload
        ));

        // Add to results
        const newResult: OMRResult = {
          id: `result-${Date.now()}-${i}`,
          filename: file.name,
          score: result.score,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          incorrectAnswers: result.incorrectAnswers,
          unanswered: result.unanswered,
          percentage: result.percentage,
          answers: result.answers,
          processingTime: result.processingTime,
          confidence: result.confidence,
          flagged: result.flagged,
          mode,
          processedAt: new Date().toISOString(),
        };

        setResults(prev => [...prev, newResult]);

        // Update upload status
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'completed', progress: 100 }
            : upload
        ));

        // Save to localStorage
        const updatedResults = [...results, newResult];
        localStorage.setItem('omrResults', JSON.stringify(updatedResults));
      }

      // Save uploads to localStorage
      const updatedUploads = [...uploads, ...newUploads];
      localStorage.setItem('omrUploads', JSON.stringify(updatedUploads));

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${files.length} file(s)`,
      });

    } catch (error) {
      console.error('File processing failed:', error);
      
      // Update failed uploads
      newUploads.forEach(upload => {
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'failed', progress: 0 }
            : u
        ));
      });

      toast({
        title: "Processing Failed",
        description: "Failed to process one or more files",
        variant: "destructive",
      });
    }
  }, [currentTest, results, uploads]);

  const handleViewResult = useCallback((result: OMRResult) => {
    setSelectedResult(result);
  }, []);

  const handleReviewResult = useCallback((result: OMRResult) => {
    setSelectedResult(result);
  }, []);

  const handleRetry = useCallback((uploadId: string) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, status: 'processing', progress: 0 }
        : upload
    ));
  }, []);

  const handleCancel = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const handleRemove = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const handleStudentIdentified = useCallback((studentInfo: { name: string; rollNumber: string }) => {
    console.log('Student identified:', studentInfo);
    setShowStudentDialog(false);
    setPendingFile(null);
    
    toast({
      title: "Student Identified",
      description: `Processing sheet for ${studentInfo.name} (${studentInfo.rollNumber})`,
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'create-test':
        return (
          <CreateTestPage 
            onTestCreated={setCurrentTest}
            currentTest={currentTest}
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

  const MainApp = () => (
    <div className="min-h-screen bg-background">
      {/* Settings Panel */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>System Configuration</DialogTitle>
            <DialogDescription>Adjust OMR processing thresholds and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="th-low">Low Confidence Threshold</Label>
              <Input 
                id="th-low"
                type="number" 
                step="0.1" 
                min="0" 
                max="1"
                value={settings.TH_LOW}
                onChange={(e) => setSettings(prev => ({ ...prev, TH_LOW: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="th-high">High Confidence Threshold</Label>
              <Input 
                id="th-high"
                type="number" 
                step="0.1" 
                min="0" 
                max="1"
                value={settings.TH_HIGH}
                onChange={(e) => setSettings(prev => ({ ...prev, TH_HIGH: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="flag-rate">Flag Rate Target</Label>
              <Input 
                id="flag-rate"
                type="number" 
                step="0.01" 
                min="0" 
                max="1"
                value={settings.flag_rate_target}
                onChange={(e) => setSettings(prev => ({ ...prev, flag_rate_target: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Interface */}
      <div className="flex h-screen">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onShowSettings={() => setShowSettings(true)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
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
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;