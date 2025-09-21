import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TestDetails, Subject } from '@/services/supabaseService';

interface CreateTestPageProps {
  onTestCreated: (testDetails: TestDetails) => void;
  onStartEvaluating: (testDetails: TestDetails) => void;
}

const CreateTestPage: React.FC<CreateTestPageProps> = ({ onTestCreated, onStartEvaluating }) => {
  const [testDetails, setTestDetails] = useState<TestDetails>({
    test_name: '',
    description: '',
    total_questions: 100,
    subjects: []
  });

  const [currentSubject, setCurrentSubject] = useState({
    name: '',
    questions: 20,
    answer_key: ''
  });

  const addSubject = () => {
    if (!currentSubject.name.trim()) {
      toast({ title: "Error", description: "Please enter subject name", variant: "destructive" });
      return;
    }

    if (!currentSubject.answer_key.trim()) {
      toast({ title: "Error", description: "Please enter answer key", variant: "destructive" });
      return;
    }

    const answerKeyArray = currentSubject.answer_key.split('').map(answer => answer.toUpperCase());
    
    if (answerKeyArray.length !== currentSubject.questions) {
      toast({ 
        title: "Error", 
        description: `Answer key length (${answerKeyArray.length}) must match number of questions (${currentSubject.questions})`, 
        variant: "destructive" 
      });
      return;
    }

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: currentSubject.name,
      questions: currentSubject.questions,
      answer_key: answerKeyArray
    };

    setTestDetails(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));

    setCurrentSubject({
      name: '',
      questions: 20,
      answer_key: ''
    });

    toast({ title: "Success", description: `Added subject: ${newSubject.name}` });
  };

  const removeSubject = (subjectId: string) => {
    setTestDetails(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== subjectId)
    }));
  };

  const handleSaveTest = () => {
    if (!testDetails.test_name.trim()) {
      toast({ title: "Error", description: "Please enter test name", variant: "destructive" });
      return;
    }

    if (testDetails.subjects.length === 0) {
      toast({ title: "Error", description: "Please add at least one subject", variant: "destructive" });
      return;
    }

    onTestCreated(testDetails);
    toast({ title: "Success", description: "Test configuration saved!" });
  };

  const handleStartEvaluating = () => {
    if (!testDetails.test_name.trim()) {
      toast({ title: "Error", description: "Please enter test name", variant: "destructive" });
      return;
    }

    if (testDetails.subjects.length === 0) {
      toast({ title: "Error", description: "Please add at least one subject", variant: "destructive" });
      return;
    }

    onStartEvaluating(testDetails);
  };

  const totalQuestions = testDetails.subjects.reduce((sum, subject) => sum + subject.questions, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create New Test</h1>
          <p className="text-muted-foreground">Configure test details, subjects, and answer keys</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveTest} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Test
          </Button>
          <Button onClick={handleStartEvaluating}>
            <Play className="h-4 w-4 mr-2" />
            Start Evaluating
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Details */}
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testName">Test Name *</Label>
              <Input
                id="testName"
                value={testDetails.test_name}
                onChange={(e) => setTestDetails(prev => ({ ...prev, test_name: e.target.value }))}
                placeholder="Enter test name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={testDetails.description}
                onChange={(e) => setTestDetails(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter test description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="totalQuestions">Total Questions</Label>
              <Input
                id="totalQuestions"
                type="number"
                value={testDetails.total_questions}
                onChange={(e) => setTestDetails(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 0 }))}
                min="1"
                max="200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Add Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subjectName">Subject Name *</Label>
              <Input
                id="subjectName"
                value={currentSubject.name}
                onChange={(e) => setCurrentSubject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Mathematics, Physics"
              />
            </div>
            <div>
              <Label htmlFor="questions">Number of Questions</Label>
              <Input
                id="questions"
                type="number"
                value={currentSubject.questions}
                onChange={(e) => setCurrentSubject(prev => ({ ...prev, questions: parseInt(e.target.value) || 0 }))}
                min="1"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="answerKey">Answer Key *</Label>
              <Input
                id="answerKey"
                value={currentSubject.answer_key}
                onChange={(e) => setCurrentSubject(prev => ({ ...prev, answer_key: e.target.value.toUpperCase() }))}
                placeholder="e.g., ABCDAABCDAABCDAABCDA"
                maxLength={currentSubject.questions}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter {currentSubject.questions} answers (A, B, C, D, E)
              </p>
            </div>
            <Button onClick={addSubject} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      {testDetails.subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configured Subjects ({testDetails.subjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testDetails.subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{subject.name}</h3>
                      <Badge variant="secondary">{subject.questions} questions</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Answer Key: {subject.answer_key}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total Questions: {totalQuestions} / {testDetails.total_questions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateTestPage;
