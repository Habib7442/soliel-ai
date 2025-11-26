"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  createLab, 
  updateLab, 
  deleteLab, 
  getCourseLabs 
} from "@/server/actions/labs.actions";
import { 
  Code, 
  Plus, 
  Edit, 
  Trash2, 
  FlaskConical, 
  Clock, 
  Trophy,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
}

interface Lab {
  id: string;
  title: string;
  description: string | null;
  lab_type: string;
  environment: string | null;
  difficulty: string | null;
  estimated_time_minutes: number | null;
  is_graded: boolean;
  max_attempts: number;
  order_index: number;
  lesson: Lesson | null;
}

interface LabsManagerProps {
  courseId: string;
}

export function LabsManager({ courseId }: LabsManagerProps) {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [expandedLab, setExpandedLab] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructionsMd: "",
    labType: "coding" as 'coding' | 'quiz_based' | 'simulation' | 'practice',
    environment: "javascript" as 'javascript' | 'python' | 'html_css' | 'sql' | 'general',
    starterCode: "",
    solutionCode: "",
    isGraded: false,
    maxAttempts: 0,
    timeLimitMinutes: 0,
    allowHints: true,
    hints: "",
    resourcesMd: "",
    estimatedTimeMinutes: 30,
    difficulty: "medium" as 'easy' | 'medium' | 'hard',
  });

  const fetchLabs = async () => {
    setLoading(true);
    const result = await getCourseLabs(courseId);
    if (result.success && result.data) {
      setLabs(result.data);
    } else {
      toast.error(result.error || "Failed to fetch labs");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a lab title");
      return;
    }

    const labData = {
      courseId,
      title: formData.title,
      description: formData.description || undefined,
      instructionsMd: formData.instructionsMd || undefined,
      labType: formData.labType,
      environment: formData.environment,
      starterCode: formData.starterCode || undefined,
      solutionCode: formData.solutionCode || undefined,
      isGraded: formData.isGraded,
      maxAttempts: formData.maxAttempts,
      timeLimitMinutes: formData.timeLimitMinutes,
      allowHints: formData.allowHints,
      hints: formData.hints ? formData.hints.split('\n').filter(h => h.trim()) : undefined,
      resourcesMd: formData.resourcesMd || undefined,
      estimatedTimeMinutes: formData.estimatedTimeMinutes,
      difficulty: formData.difficulty,
    };

    let result;
    if (editingLab) {
      result = await updateLab(editingLab.id, labData);
    } else {
      result = await createLab(labData);
    }

    if (result.success) {
      toast.success(editingLab ? "Lab updated successfully" : "Lab created successfully");
      setDialogOpen(false);
      resetForm();
      fetchLabs();
    } else {
      toast.error(result.error || "Failed to save lab");
    }
  };

  const handleEdit = (lab: Lab) => {
    setEditingLab(lab);
    setFormData({
      title: lab.title,
      description: lab.description || "",
      instructionsMd: "",
      labType: lab.lab_type as 'coding' | 'quiz_based' | 'simulation' | 'practice',
      environment: (lab.environment as 'javascript' | 'python' | 'html_css' | 'sql' | 'general') || "javascript",
      starterCode: "",
      solutionCode: "",
      isGraded: lab.is_graded,
      maxAttempts: lab.max_attempts,
      timeLimitMinutes: 0,
      allowHints: true,
      hints: "",
      resourcesMd: "",
      estimatedTimeMinutes: lab.estimated_time_minutes || 30,
      difficulty: (lab.difficulty as 'easy' | 'medium' | 'hard') || "medium",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (labId: string) => {
    if (!confirm("Are you sure you want to delete this lab? This action cannot be undone.")) {
      return;
    }

    const result = await deleteLab(labId);
    if (result.success) {
      toast.success("Lab deleted successfully");
      fetchLabs();
    } else {
      toast.error(result.error || "Failed to delete lab");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructionsMd: "",
      labType: "coding",
      environment: "javascript",
      starterCode: "",
      solutionCode: "",
      isGraded: false,
      maxAttempts: 0,
      timeLimitMinutes: 0,
      allowHints: true,
      hints: "",
      resourcesMd: "",
      estimatedTimeMinutes: 30,
      difficulty: "medium",
    });
    setEditingLab(null);
  };

  const getLabTypeIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="h-4 w-4" />;
      case 'quiz_based': return <Trophy className="h-4 w-4" />;
      case 'simulation': return <FlaskConical className="h-4 w-4" />;
      default: return <FlaskConical className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Labs & Hands-on Practice
            </CardTitle>
            <CardDescription>
              Create interactive coding exercises and practice labs for students
            </CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lab
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading labs...</div>
        ) : labs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No labs created yet</p>
            <p className="text-sm">Create your first interactive lab to enhance student learning</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labs.map((lab) => (
              <div key={lab.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getLabTypeIcon(lab.lab_type)}
                      <h4 className="font-semibold">{lab.title}</h4>
                      <Badge className={getDifficultyColor(lab.difficulty)}>
                        {lab.difficulty || 'medium'}
                      </Badge>
                      {lab.is_graded && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          Graded
                        </Badge>
                      )}
                    </div>
                    
                    {lab.description && (
                      <p className="text-sm text-muted-foreground mb-3">{lab.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        <span className="capitalize">{lab.environment || lab.lab_type}</span>
                      </div>
                      {lab.estimated_time_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{lab.estimated_time_minutes} min</span>
                        </div>
                      )}
                      {lab.max_attempts > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          <span>Max {lab.max_attempts} attempts</span>
                        </div>
                      )}
                    </div>

                    {expandedLab === lab.id && (
                      <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                        <div>
                          <strong>Lab Type:</strong> <span className="capitalize">{lab.lab_type.replace('_', ' ')}</span>
                        </div>
                        {lab.lesson && (
                          <div>
                            <strong>Linked Lesson:</strong> {lab.lesson.title}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedLab(expandedLab === lab.id ? null : lab.id)}
                    >
                      {expandedLab === lab.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lab)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(lab.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLab ? "Edit Lab" : "Create New Lab"}</DialogTitle>
              <DialogDescription>
                Create an interactive practice lab for students to apply their knowledge
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lab Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Build a Todo App with React"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what students will build..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="labType">Lab Type</Label>
                  <Select 
                    value={formData.labType} 
                    onValueChange={(value: 'coding' | 'quiz_based' | 'simulation' | 'practice') => setFormData({ ...formData, labType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coding">Coding Exercise</SelectItem>
                      <SelectItem value="quiz_based">Quiz-based Practice</SelectItem>
                      <SelectItem value="simulation">Simulation</SelectItem>
                      <SelectItem value="practice">General Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select 
                    value={formData.environment} 
                    onValueChange={(value: 'javascript' | 'python' | 'html_css' | 'sql' | 'general') => setFormData({ ...formData, environment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="html_css">HTML/CSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Est. Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={formData.estimatedTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 0 })}
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructionsMd">Instructions (Markdown)</Label>
                <Textarea
                  id="instructionsMd"
                  value={formData.instructionsMd}
                  onChange={(e) => setFormData({ ...formData, instructionsMd: e.target.value })}
                  placeholder="## Task&#10;Complete the function...&#10;&#10;### Requirements&#10;- Feature 1&#10;- Feature 2"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="starterCode">Starter Code</Label>
                <Textarea
                  id="starterCode"
                  value={formData.starterCode}
                  onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                  placeholder="function solution() {&#10;  // Your code here&#10;}"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solutionCode">Solution Code (Hidden from students)</Label>
                <Textarea
                  id="solutionCode"
                  value={formData.solutionCode}
                  onChange={(e) => setFormData({ ...formData, solutionCode: e.target.value })}
                  placeholder="function solution() {&#10;  return 'answer';&#10;}"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hints">Hints (one per line)</Label>
                <Textarea
                  id="hints"
                  value={formData.hints}
                  onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
                  placeholder="Start by defining the main function&#10;Remember to handle edge cases&#10;Use a loop for iteration"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="isGraded">Graded Lab</Label>
                  <p className="text-sm text-muted-foreground">Include this lab in course completion</p>
                </div>
                <Switch
                  id="isGraded"
                  checked={formData.isGraded}
                  onCheckedChange={(checked) => setFormData({ ...formData, isGraded: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLab ? "Update Lab" : "Create Lab"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
