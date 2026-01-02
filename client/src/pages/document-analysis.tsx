import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Copy, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Lightbulb,
  Target,
  TrendingUp,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  success: boolean;
  analysisType?: string;
  summary?: string;
  keyInsights?: string[];
  strengths?: string[];
  challenges?: string[];
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  actionItems?: string[];
  overallScore?: number;
  recommendations?: string[];
  conclusion?: string;
  message?: string;
}

export default function DocumentAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Form state
  const [documentText, setDocumentText] = useState('');
  const [analysisType, setAnalysisType] = useState('Comprehensive Analysis');

  // Available analysis types
  const analysisTypes = [
    'Comprehensive Analysis',
    'Summary',
    'Key Points',
    'Sentiment Analysis',
    'Action Items'
  ];

  const analyzeDocument = async () => {
    // Validate document text is not empty
    if (!documentText.trim()) {
      toast.error('Please enter document text to analyze');
      return;
    }

    // Check character limit
    if (documentText.length > 10000) {
      toast.error('Document text must be 10,000 characters or less');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentText,
          analysisType
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast.success('Document analyzed successfully!');
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze document';
      setResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const isDocumentEmpty = !documentText.trim();
  const characterCount = documentText.length;
  const isOverLimit = characterCount > 10000;

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600 bg-green-100';
      case 'Negative': return 'text-red-600 bg-red-100';
      case 'Neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Document Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze documents with AI-powered insights and recommendations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Input
            </CardTitle>
            <CardDescription>
              Enter your document text and select analysis type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="documentText">Document Text *</Label>
                <div className="text-sm text-gray-500">
                  {characterCount.toLocaleString()}/10,000 characters
                  {isOverLimit && (
                    <span className="text-red-500 ml-2">Limit exceeded!</span>
                  )}
                </div>
              </div>
              <Textarea
                id="documentText"
                placeholder="Paste your document content here for analysis..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                className={`mt-1 min-h-[200px] ${isOverLimit ? 'border-red-500' : ''}`}
                rows={10}
              />
              {isDocumentEmpty && (
                <p className="text-sm text-red-500 mt-1">Document text is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="analysisType">Analysis Type</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <Button
              onClick={analyzeDocument}
              disabled={loading || isDocumentEmpty || isOverLimit}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Analyze Document
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Analysis Result
            </CardTitle>
            <CardDescription>
              AI-powered document insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                <p className="text-gray-600">Analyzing document with AI...</p>
              </div>
            )}

            {result && result.success && (
              <div className="space-y-6">
                {/* Analysis Type & Score */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm">
                    {result.analysisType}
                  </Badge>
                  {result.overallScore && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Score:</span>
                      <span className={`font-bold text-lg ${getScoreColor(result.overallScore)}`}>
                        {result.overallScore}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {result.summary && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Summary
                      </Label>
                      <Button
                        onClick={() => copyToClipboard(result.summary!)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">{result.summary}</p>
                    </div>
                  </div>
                )}

                {/* Sentiment (if available) */}
                {result.sentiment && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Sentiment Analysis
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge className={getSentimentColor(result.sentiment)}>
                        {result.sentiment}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {result.keyInsights && result.keyInsights.length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4" />
                      Key Insights
                    </Label>
                    <div className="space-y-2">
                      {result.keyInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {result.strengths && result.strengths.length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      Strengths
                    </Label>
                    <div className="space-y-2">
                      {result.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {result.challenges && result.challenges.length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Challenges & Limitations
                    </Label>
                    <div className="space-y-2">
                      {result.challenges.map((challenge, index) => (
                        <div key={index} className="flex items-start gap-2 bg-orange-50 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{challenge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {result.actionItems && result.actionItems.length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4" />
                      Action Items
                    </Label>
                    <div className="space-y-2">
                      {result.actionItems.map((action, index) => (
                        <div key={index} className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                          <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Recommendations
                    </Label>
                    <div className="space-y-2">
                      {result.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conclusion */}
                {result.conclusion && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Overall Conclusion
                      </Label>
                      <Button
                        onClick={() => copyToClipboard(result.conclusion!)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium">{result.conclusion}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {result && !result.success && result.message && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <Label className="font-medium text-red-600">Analysis Failed</Label>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">{result.message}</p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your document text and click "Analyze Document" to get AI-powered insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}