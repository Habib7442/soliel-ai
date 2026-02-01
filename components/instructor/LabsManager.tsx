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
    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
               <FlaskConical className="h-6 w-6" />
            </div>
            Labs & Hands-on Practice
          </CardTitle>
          <CardDescription className="text-base font-medium mt-1 ml-14">
            Create interactive coding exercises and practice labs for students
          </CardDescription>
        </div>
        <Button 
          onClick={() => { resetForm(); setDialogOpen(true); }}
          className="rounded-xl h-12 bg-gray-900 hover:bg-primary font-bold shadow-lg shadow-black/10 px-6 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Lab
        </Button>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-medium">
             <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p>Loading labs...</p>
             </div>
          </div>
        ) : labs.length === 0 ? (
          <div className="text-center py-24 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-200/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
               <FlaskConical className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No labs created yet</h3>
            <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
              Create your first interactive lab to enhance student learning with real-world practice.
            </p>
            <Button 
              onClick={() => { resetForm(); setDialogOpen(true); }}
              variant="outline"
              className="rounded-xl font-bold h-12 px-8 border-gray-300 hover:border-primary hover:text-primary"
            >
              Start Building
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {labs.map((lab) => (
              <div key={lab.id} className="group border border-gray-100 bg-white rounded-[1.5rem] p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                         {getLabTypeIcon(lab.lab_type)}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{lab.title}</h4>
                      <Badge className={`rounded-lg px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider border-0 ${getDifficultyColor(lab.difficulty)}`}>
                        {lab.difficulty || 'medium'}
                      </Badge>
                      {lab.is_graded && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold rounded-lg px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          Graded
                        </Badge>
                      )}
                    </div>
                    
                    {lab.description && (
                      <p className="text-sm text-muted-foreground font-medium mb-4 pl-11 max-w-2xl">{lab.description}</p>
                    )}

                    <div className="flex items-center gap-6 pl-11 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Code className="h-3.5 w-3.5 text-gray-500" />
                        <span className="capitalize text-xs font-bold text-gray-700">{lab.environment || lab.lab_type}</span>
                      </div>
                      {lab.estimated_time_minutes && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs font-bold text-gray-700">{lab.estimated_time_minutes} min</span>
                        </div>
                      )}
                      {lab.max_attempts > 0 && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Trophy className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs font-bold text-gray-700">Max {lab.max_attempts} attempts</span>
                        </div>
                      )}
                    </div>

                    {expandedLab === lab.id && (
                      <div className="mt-6 pt-6 border-t border-gray-100 pl-11 space-y-3 text-sm animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 gap-4 max-w-lg">
                           <div>
                              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Lab Type</p>
                              <p className="font-bold text-gray-900 capitalize">{lab.lab_type.replace('_', ' ')}</p>
                           </div>
                           {lab.lesson && (
                              <div>
                                 <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Linked Lesson</p>
                                 <p className="font-bold text-gray-900">{lab.lesson.title}</p>
                              </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4 self-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => setExpandedLab(expandedLab === lab.id ? null : lab.id)}
                    >
                      {expandedLab === lab.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-gray-400 hover:text-primary hover:bg-primary/10"
                      onClick={() => handleEdit(lab)}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(lab.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 gap-0">
            <DialogHeader className="p-8 pb-4 border-b border-gray-100">
              <DialogTitle className="text-2xl font-black">{editingLab ? "Edit Lab" : "Create New Lab"}</DialogTitle>
              <DialogDescription className="text-base font-medium text-muted-foreground mt-1">
                Create an interactive practice lab for students to apply their knowledge
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold text-gray-900">Lab Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Build a Todo App with React"
                  required
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold text-gray-900">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what students will build..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="labType" className="font-bold text-gray-900">Lab Type</Label>
                  <Select 
                    value={formData.labType} 
                    onValueChange={(value: 'coding' | 'quiz_based' | 'simulation' | 'practice') => setFormData({ ...formData, labType: value })}
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="coding">Coding Exercise</SelectItem>
                      <SelectItem value="quiz_based">Quiz-based Practice</SelectItem>
                      <SelectItem value="simulation">Simulation</SelectItem>
                      <SelectItem value="practice">General Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment" className="font-bold text-gray-900">Environment</Label>
                  <Select 
                    value={formData.environment} 
                    onValueChange={(value: 'javascript' | 'python' | 'html_css' | 'sql' | 'general') => setFormData({ ...formData, environment: value })}
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="html_css">HTML/CSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="font-bold text-gray-900">Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime" className="font-bold text-gray-900">Est. Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={formData.estimatedTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="rounded-xl h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts" className="font-bold text-gray-900">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 0 })}
                    placeholder="0 = unlimited"
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructionsMd" className="font-bold text-gray-900">Instructions (Markdown)</Label>
                <Textarea
                  id="instructionsMd"
                  value={formData.instructionsMd}
                  onChange={(e) => setFormData({ ...formData, instructionsMd: e.target.value })}
                  placeholder="## Task&#10;Complete the function...&#10;&#10;### Requirements&#10;- Feature 1&#10;- Feature 2"
                  rows={5}
                  className="rounded-xl resize-none font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="starterCode" className="font-bold text-gray-900">Starter Code</Label>
                <Textarea
                  id="starterCode"
                  value={formData.starterCode}
                  onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                  placeholder="function solution() {&#10;  // Your code here&#10;}"
                  rows={4}
                  className="rounded-xl font-mono text-sm bg-gray-50 border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solutionCode" className="font-bold text-gray-900">Solution Code (Hidden from students)</Label>
                <Textarea
                  id="solutionCode"
                  value={formData.solutionCode}
                  onChange={(e) => setFormData({ ...formData, solutionCode: e.target.value })}
                  placeholder="function solution() {&#10;  return 'answer';&#10;}"
                  rows={4}
                  className="rounded-xl font-mono text-sm bg-gray-50 border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hints" className="font-bold text-gray-900">Hints (one per line)</Label>
                <Textarea
                  id="hints"
                  value={formData.hints}
                  onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
                  placeholder="Start by defining the main function&#10;Remember to handle edge cases&#10;Use a loop for iteration"
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <div>
                  <Label htmlFor="isGraded" className="font-bold text-gray-900">Graded Lab</Label>
                  <p className="text-sm font-medium text-muted-foreground">Include this lab in course completion</p>
                </div>
                <Switch
                  id="isGraded"
                  checked={formData.isGraded}
                  onCheckedChange={(checked) => setFormData({ ...formData, isGraded: checked })}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-12 font-bold px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl h-12 font-bold px-6 bg-gray-900 hover:bg-primary shadow-lg shadow-black/5">
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
