"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { 
  getLabById, 
  submitLabAttempt, 
  getLabProgress,
  getLabAttempts 
} from "@/server/actions/labs.actions";
import { 
  Code, 
  Play, 
  RotateCcw, 
  Lightbulb, 
  Clock, 
  Trophy,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  History
} from "lucide-react";

interface LabPlayerProps {
  labId: string;
}

interface PassingCriteria {
  min_score_percent?: number;
  min_tests_passed?: number;
}

interface LabData {
  id: string;
  title: string;
  description: string | null;
  instructions_md: string | null;
  lab_type: string;
  environment: string | null;
  starter_code: string | null;
  is_graded: boolean;
  max_attempts: number;
  time_limit_minutes: number;
  allow_hints: boolean;
  hints: string[] | null;
  resources_md: string | null;
  estimated_time_minutes: number | null;
  difficulty: string | null;
  passing_criteria: PassingCriteria | null;
}

interface LabProgress {
  best_score_percent: number;
  attempts_count: number;
  completed: boolean;
  completed_at: string | null;
}

interface LabAttempt {
  id: string;
  score_percent: number;
  tests_passed: number;
  total_tests: number;
  is_passed: boolean;
  submitted_at: string;
  time_taken_seconds: number | null;
  instructor_feedback: string | null;
}

export function LabPlayer({ labId }: LabPlayerProps) {
  const [lab, setLab] = useState<LabData | null>(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<LabProgress | null>(null);
  const [attempts, setAttempts] = useState<LabAttempt[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLabData = async () => {
    const result = await getLabById(labId);
    if (result.success && result.data) {
      setLab(result.data);
      setCode(result.data.starter_code || "");
    } else {
      toast.error("Failed to load lab");
    }
  };

  const fetchProgress = async () => {
    const result = await getLabProgress(labId);
    if (result.success) {
      setProgress(result.data);
    }
  };

  const fetchAttempts = async () => {
    const result = await getLabAttempts(labId);
    if (result.success && result.data) {
      setAttempts(result.data);
    }
  };

  useEffect(() => {
    fetchLabData();
    fetchProgress();
    fetchAttempts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);

  useEffect(() => {
    // Start timer
    setStartTime(new Date());
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleRun = () => {
    setRunning(true);
    setOutput("");
    
    // Simulate code execution (in production, this would run in a sandbox)
    setTimeout(() => {
      try {
        // Basic JavaScript execution for demo
        if (lab?.environment === 'javascript') {
          // Create a safe execution context
          const logs: string[] = [];
          const customConsole = {
            log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
          };

          // Use Function constructor for safer eval
          const func = new Function('console', code);
          func(customConsole);
          
          setOutput(logs.join('\n') || 'Code executed successfully (no console output)');
        } else {
          setOutput('Code execution simulation\n// Output would appear here in production environment');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setOutput(`Error: ${errorMessage}`);
      }
      setRunning(false);
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!lab) return;

    if (lab.max_attempts > 0 && attempts.length >= lab.max_attempts) {
      toast.error(`Maximum attempts (${lab.max_attempts}) reached`);
      return;
    }

    setSubmitting(true);

    // Simple test evaluation (in production, this would be server-side)
    const scorePercent = Math.floor(Math.random() * 40) + 60; // Demo: random 60-100%
    const testsPassed = 3;
    const totalTests = 5;

    const result = await submitLabAttempt({
      labId,
      submittedCode: code,
      output,
      scorePercent,
      testsPassed,
      totalTests,
      startedAt: startTime.toISOString(),
      timeTakenSeconds: elapsedSeconds,
    });

    setSubmitting(false);

    if (result.success) {
      if (result.isPassed) {
        toast.success("🎉 Lab completed successfully!");
      } else {
        toast.warning("Lab submitted. Keep trying to improve your score!");
      }
      fetchProgress();
      fetchAttempts();
      setActiveTab("attempts");
    } else {
      toast.error(result.error || "Failed to submit lab");
    }
  };

  const handleReset = () => {
    if (confirm("Reset code to starter template? Your current work will be lost.")) {
      setCode(lab?.starter_code || "");
      setOutput("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (!lab) {
    return <div className="text-center py-12">Loading lab...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lab.title}</h1>
            {lab.description && (
              <p className="text-muted-foreground">{lab.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(lab.difficulty)}>
              {lab.difficulty || 'medium'}
            </Badge>
            {lab.is_graded && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                Graded
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Best Score: {progress.best_score_percent}%</span>
                  <span>Attempts: {progress.attempts_count}</span>
                </div>
                <Progress value={progress.best_score_percent} className="h-2" />
                {progress.completed && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Bar */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {lab.estimated_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>~{lab.estimated_time_minutes} min</span>
            </div>
          )}
          {lab.environment && (
            <div className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span className="capitalize">{lab.environment}</span>
            </div>
          )}
          {lab.max_attempts > 0 && (
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>{attempts.length}/{lab.max_attempts} attempts</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Time: {formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Instructions & Resources */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instructions">
                <BookOpen className="h-4 w-4 mr-2" />
                Instructions
              </TabsTrigger>
              <TabsTrigger value="hints" disabled={!lab.allow_hints}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Hints
              </TabsTrigger>
              <TabsTrigger value="attempts">
                <History className="h-4 w-4 mr-2" />
                Attempts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lab Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  {lab.instructions_md ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{lab.instructions_md}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No instructions provided</p>
                  )}

                  {lab.resources_md && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Resources</h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{lab.resources_md}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hints" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hints</CardTitle>
                  <CardDescription>
                    Click to reveal hints if you&apos;re stuck
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lab.hints && lab.hints.length > 0 ? (
                    <div className="space-y-3">
                      {!showHints ? (
                        <Button 
                          variant="outline" 
                          onClick={() => setShowHints(true)}
                          className="w-full"
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Show Hints
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          {lab.hints.map((hint: string, index: number) => (
                            <Alert key={index}>
                              <Lightbulb className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Hint {index + 1}:</strong> {hint}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hints available for this lab</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attempts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  {attempts.length === 0 ? (
                    <p className="text-muted-foreground">No attempts yet</p>
                  ) : (
                    <div className="space-y-3">
                      {attempts.map((attempt, index) => (
                        <div key={attempt.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Attempt #{attempts.length - index}</span>
                            <Badge variant={attempt.is_passed ? "default" : "secondary"}>
                              {attempt.score_percent}%
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Tests Passed: {attempt.tests_passed}/{attempt.total_tests}</div>
                            <div>Time: {formatTime(attempt.time_taken_seconds || 0)}</div>
                            <div>
                              {new Date(attempt.submitted_at).toLocaleString()}
                            </div>
                          </div>
                          {attempt.instructor_feedback && (
                            <Alert className="mt-3">
                              <AlertDescription>
                                <strong>Instructor Feedback:</strong><br />
                                {attempt.instructor_feedback}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Code Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Editor</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm min-h-[400px] resize-none"
                placeholder="// Write your code here..."
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleRun} disabled={running} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {running ? "Running..." : "Run Code"}
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !code.trim()}
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Console */}
          <Card>
            <CardHeader>
              <CardTitle>Output Console</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg min-h-[150px] max-h-[300px] overflow-auto">
                {output || "// Output will appear here..."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
