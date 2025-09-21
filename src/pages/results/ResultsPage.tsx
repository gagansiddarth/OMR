import React, { useState } from 'react';
import { 
  FileText, Flag, TrendingUp, Target, Search, Filter, Eye, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ResultsPageProps {
  results: any[];
  onReviewResult: (result: any) => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ results, onReviewResult }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Results Dashboard</h2>
          <p className="text-muted-foreground">View and filter OMR processing results</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-sm text-muted-foreground">Total Sheets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold">
                  {results.reduce((sum, r) => sum + (r.flagged_questions?.length || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Flagged Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {results.length > 0 
                    ? Math.round(results.reduce((sum, r) => sum + (r.scores?.Total || 0), 0) / results.length)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / results.length * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No results yet</p>
              <p className="text-sm">Upload and process OMR sheets to see results here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.upload_id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.student_id}</span>
                      {(result.flagged_questions?.length > 0) && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Total: {result.scores?.Total || 0}/100</span>
                      {result.scores?.subject_scores ? (
                        // Display dynamic subject scores
                        Object.entries(result.scores.subject_scores)
                          .filter(([key]) => key !== 'Total')
                          .map(([subject, score]) => (
                            <span key={subject}>
                              {subject}: {score}/{subject === 'Total' ? 100 : 20}
                            </span>
                          ))
                      ) : (
                        // Fallback to hardcoded subjects
                        <>
                          <span>Math: {result.scores?.Math || 0}/20</span>
                          <span>AI/ML: {result.scores?.['AI/ML'] || 0}/20</span>
                          <span>Stats: {result.scores?.Stats || 0}/20</span>
                          <span>Python: {result.scores?.Python || 0}/20</span>
                          <span>GenAI: {result.scores?.GenAI || 0}/20</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round((result.confidence_score || 0) * 100)}% | 
                      Mode: {result.evaluation_mode} | 
                      Processed: {new Date(result.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => onReviewResult(result)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPage;
