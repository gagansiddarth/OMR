import React, { useState } from 'react';
import { 
  Upload, Camera, Trash2, RefreshCw, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import SupabaseTest from '@/components/features/SupabaseTest';
import EnvTest from '@/components/features/EnvTest';
import { EnvironmentSetup } from '@/components/features/EnvironmentSetup';
import { SupabaseConnectionTest } from '@/components/features/SupabaseConnectionTest';
import { UploadTest } from '@/components/features/UploadTest';
import BackendTest from '@/components/features/BackendTest';
import { EvaluationMode, TestDetails } from '@/types';

interface UploadPageProps {
  onFileUpload: (files: FileList, mode: EvaluationMode) => Promise<void>;
  uploads: any[];
  currentTest: TestDetails | null;
}

const UploadPage: React.FC<UploadPageProps> = ({ onFileUpload, uploads, currentTest }) => {
  const [showSupabaseTest, setShowSupabaseTest] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('moderate');
  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [uploadTestResult, setUploadTestResult] = useState<'success' | 'error' | undefined>();
  const [uploadTestMessage, setUploadTestMessage] = useState<string>('');

  const handleFileUpload = async (files: FileList) => {
    console.log('UploadPage: handleFileUpload called with files:', files.length, 'currentTest:', currentTest?.testName);
    try {
      await onFileUpload(files, evaluationMode);
    } catch (error) {
      console.error('UploadPage: File upload failed:', error);
    }
  };

  const handleTestUpload = async () => {
    setIsTestingUpload(true);
    setUploadTestResult(undefined);
    setUploadTestMessage('');

    try {
      // Create a mock file for testing
      const mockFile = new File(['test content'], 'test-omr.png', { type: 'image/png' });
      const mockFileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => index === 0 ? mockFile : null,
        [Symbol.iterator]: function* () {
          yield mockFile;
        }
      } as FileList;

      await onFileUpload(mockFileList, evaluationMode);
      
      // Wait a bit to see if processing completes
      setTimeout(() => {
        setUploadTestResult('success');
        setUploadTestMessage('Upload flow test completed successfully');
        setIsTestingUpload(false);
      }, 3000);
      
    } catch (error) {
      console.error('Upload test failed:', error);
      setUploadTestResult('error');
      setUploadTestMessage(error instanceof Error ? error.message : 'Unknown error');
      setIsTestingUpload(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upload OMR Sheets</h2>
          <p className="text-muted-foreground">Upload single images or ZIP files containing multiple sheets</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Evaluation Mode:</label>
            <select 
              value={evaluationMode} 
              onChange={(e) => setEvaluationMode(e.target.value as EvaluationMode)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSupabaseTest(!showSupabaseTest)}
          >
            <Database className="h-4 w-4 mr-1" />
            Test Database
          </Button>
        </div>
      </div>

      {/* Current Test Information */}
      {currentTest ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Current Test: {currentTest.testName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-green-700">Total Questions</p>
                <p className="text-2xl font-bold text-green-800">{currentTest.totalQuestions}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Subjects</p>
                <p className="text-2xl font-bold text-green-800">{currentTest.subjects.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Description</p>
                <p className="text-sm text-green-600">{currentTest.description || 'No description'}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-green-700 mb-2">Subjects:</p>
              <div className="flex flex-wrap gap-2">
                {currentTest.subjects.map((subject) => (
                  <span key={subject.id} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {subject.name} ({subject.questions} questions)
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-orange-800 font-medium">No Test Selected</p>
              <p className="text-orange-600 text-sm">Please create a test first before uploading OMR sheets</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supabase Test Component */}
      {showSupabaseTest && (
        <div className="space-y-4">
          <EnvTest />
          <SupabaseTest />
        </div>
      )}

      {/* Environment Setup */}
      {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) && (
        <EnvironmentSetup />
      )}

      {/* Supabase Connection Test */}
      {import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('your-project') && (
        <SupabaseConnectionTest />
      )}

            {/* Backend API Test */}
            <BackendTest />

            {/* Upload Flow Test */}
            {currentTest && (
              <UploadTest 
                onTestUpload={handleTestUpload}
                isTesting={isTestingUpload}
                testResult={uploadTestResult}
                testMessage={uploadTestMessage}
              />
            )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Single Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-2">Drag & drop OMR sheets here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to select files</p>
              <input
                type="file"
                multiple
                accept="image/*,.zip"
                className="hidden"
                id="file-upload"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <Button asChild>
                <label htmlFor="file-upload">Select Files</label>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Capture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
              <p>Capture OMR sheets directly</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id="camera-capture"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <Button asChild>
                <label htmlFor="camera-capture">Open Camera</label>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.map((upload, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{upload.filename}</span>
                      <span className="text-sm text-muted-foreground">{upload.status}</span>
                    </div>
                    <Progress value={upload.progress || 75} className="h-2" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadPage;
