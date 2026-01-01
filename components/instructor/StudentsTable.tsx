"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Mail, Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

interface Student {
  id: string;
  enrollment_id: string;
  full_name: string;
  email: string;
  enrollment_date: string;
  progress_percent: number;
  last_activity: string | null;
}

interface StudentsTableProps {
  students: Student[];
  courseId: string;
}

export function StudentsTable({ students, courseId }: StudentsTableProps) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  const toggleExpand = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };
  
  const getStatusBadge = (progress: number, lastActivity: string | null) => {
    if (progress === 100) {
      return <Badge className="bg-green-600">Completed</Badge>;
    }
    
    if (!lastActivity) {
      return <Badge variant="secondary">Not Started</Badge>;
    }
    
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const daysSinceActivity = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActivity <= 7) {
      return <Badge className="bg-blue-600">Active</Badge>;
    }
    
    if (daysSinceActivity <= 30) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    
    return <Badge variant="destructive">Dormant</Badge>;
  };
  
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No students enrolled yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Enrollment Date</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <>
              <TableRow 
                key={student.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleExpand(student.id)}
              >
                <TableCell>
                  {expandedStudent === student.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {student.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(student.enrollment_date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{student.progress_percent}%</span>
                    </div>
                    <Progress value={student.progress_percent} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>
                  {student.last_activity ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(new Date(student.last_activity))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No activity</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(student.progress_percent, student.last_activity)}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(student.id);
                    }}
                  >
                    View Progress
                  </Button>
                </TableCell>
              </TableRow>
              
              {/* Expanded Details */}
              {expandedStudent === student.id && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/30">
                    <StudentProgressDetails 
                      student={student} 
                      courseId={courseId}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StudentProgressDetails({ student, courseId }: { student: Student; courseId: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{student.progress_percent}%</span>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <Progress value={student.progress_percent} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {student.progress_percent === 100 ? 'Course completed!' : 'In progress'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Enrollment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">
                {new Date(student.enrollment_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Days Enrolled</span>
              <span className="font-medium">
                {Math.floor((new Date().getTime() - new Date(student.enrollment_date).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Active</span>
              <span className="font-medium">
                {student.last_activity
                  ? formatRelativeTime(new Date(student.last_activity))
                  : 'Never'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {student.progress_percent === 100 ? (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : student.last_activity ? (
                  'Learning'
                ) : (
                  'Not Started'
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">Lesson Progress</h4>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center py-4">
              Detailed lesson-by-lesson progress coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
