import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Eye, User, Calendar, Award, TrendingUp } from 'lucide-react';
import { OMRResult } from '@/types';
import { supabaseService, Evaluation } from '@/services/supabaseService';
import { toast } from '@/hooks/use-toast';

interface StudentReport {
  studentId: string;
  studentName: string;
  testName: string;
  results: OMRResult[];
  totalTests: number;
  averageScore: number;
  bestScore: number;
  latestTest: string;
}

interface ReportsPageProps {
  results: OMRResult[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ results }) => {
  const [searchId, setSearchId] = useState('');
  const [studentReport, setStudentReport] = useState<StudentReport | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchStudent = async () => {
    if (!searchId.trim()) {
      return;
    }

    setIsSearching(true);
    
    try {
      // Get student evaluations from Supabase
      const evaluations = await supabaseService.getEvaluationsByStudent(searchId);
      console.log('Student evaluations from Supabase:', evaluations);

      if (evaluations.length === 0) {
        setStudentReport(null);
        setIsSearching(false);
        toast({
          title: "No Results Found",
          description: `No evaluations found for student ID: ${searchId}`,
          variant: "destructive"
        });
        return;
      }

      // Convert evaluations to OMR results format
      const studentResults: OMRResult[] = evaluations.map((evaluation: Evaluation) => ({
        upload_id: evaluation.id || '',
        student_id: evaluation.student_id,
        filename: `evaluation_${evaluation.id}`,
        answers: evaluation.per_question || [],
        scores: evaluation.per_subject_scores || {},
        flagged_questions: evaluation.flags?.ambiguous_questions || [],
        confidence_score: evaluation.confidence_score,
        processing_time: evaluation.processing_time,
        evaluation_mode: 'moderate' as any,
        created_at: evaluation.created_at || new Date().toISOString()
      }));

    // Group by test (assuming test name is in filename or we can add it)
    const testGroups = studentResults.reduce((acc, result) => {
      const testName = result.filename.split('_')[0] || 'Unknown Test';
      if (!acc[testName]) {
        acc[testName] = [];
      }
      acc[testName].push(result);
      return acc;
    }, {} as Record<string, OMRResult[]>);

    const testNames = Object.keys(testGroups);
    const allResults = Object.values(testGroups).flat();
    
    const report: StudentReport = {
      studentId: searchId,
      studentName: studentResults[0].student_id, // This should be actual name
      testName: testNames[0] || 'Unknown Test',
      results: allResults,
      totalTests: allResults.length,
      averageScore: Math.round(allResults.reduce((sum, r) => sum + (r.scores?.Total || 0), 0) / allResults.length),
      bestScore: Math.max(...allResults.map(r => r.scores?.Total || 0)),
      latestTest: allResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || ''
    };

    setStudentReport(report);
    
    } catch (error) {
      console.error('Error searching student:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for student results",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const exportStudentReport = () => {
    if (!studentReport) return;
    
    const csvContent = [
      ['Student ID', 'Student Name', 'Test Name', 'Date', 'Total Score', 'Math', 'AI/ML', 'Stats', 'Python', 'GenAI', 'Confidence'],
      ...studentReport.results.map(result => [
        result.student_id,
        studentReport.studentName,
        studentReport.testName,
        new Date(result.created_at).toLocaleDateString(),
        result.scores?.Total || 0,
        result.scores?.Math || 0,
        result.scores?.['AI/ML'] || 0,
        result.scores?.Stats || 0,
        result.scores?.Python || 0,
        result.scores?.GenAI || 0,
        Math.round((result.confidence_score || 0) * 100) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${studentReport.studentId}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Reports</h1>
          <p className="text-muted-foreground">Search and view student test results</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Student Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter student ID to search"
                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchStudent} disabled={isSearching || !searchId.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Report */}
      {studentReport ? (
        <div className="space-y-6">
          {/* Student Summary */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {studentReport.studentName}
                  </CardTitle>
                  <p className="text-muted-foreground">ID: {studentReport.studentId}</p>
                </div>
                <Button onClick={exportStudentReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{studentReport.totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{studentReport.averageScore}</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{studentReport.bestScore}</div>
                  <div className="text-sm text-muted-foreground">Best Score</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {studentReport.results.filter(r => (r.scores?.Total || 0) >= 80).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tests ≥ 80%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Total Score</TableHead>
                    <TableHead>Math</TableHead>
                    <TableHead>AI/ML</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Python</TableHead>
                    <TableHead>GenAI</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentReport.results
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((result, index) => (
                    <TableRow key={result.upload_id}>
                      <TableCell>
                        {new Date(result.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.filename}
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.scores?.Total >= 80 ? "default" : "secondary"}>
                          {result.scores?.Total || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.scores?.Math || 0}</TableCell>
                      <TableCell>{result.scores?.['AI/ML'] || 0}</TableCell>
                      <TableCell>{result.scores?.Stats || 0}</TableCell>
                      <TableCell>{result.scores?.Python || 0}</TableCell>
                      <TableCell>{result.scores?.GenAI || 0}</TableCell>
                      <TableCell>
                        {Math.round((result.confidence_score || 0) * 100)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.flagged_questions?.length > 0 ? "destructive" : "default"}>
                          {result.flagged_questions?.length > 0 ? 'Flagged' : 'Clean'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : searchId && !isSearching ? (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No test results found for student ID: {searchId}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ReportsPage;
