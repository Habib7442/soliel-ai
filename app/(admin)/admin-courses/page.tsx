"use client";

import { useEffect, useState } from "react";
import { 
  getAllCoursesForAdmin, 
  approveCourse, 
  rejectCourse, 
  unpublishCourse,
  deleteCourseAsAdmin,
  getCourseStatistics 
} from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  XCircle, 
  Archive, 
  Trash2, 
  Eye, 
  BookOpen,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Instructor {
  id: string;
  full_name: string | null;
  email: string;
}

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  price_cents: number;
  status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  instructor: Instructor;
  rejection_reason: string | null;
}

interface CourseStats {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  archived: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats>({
    total: 0,
    published: 0,
    pending: 0,
    rejected: 0,
    archived: 0
  });
  const [loading, setLoading] = useState(true);
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published' | 'rejected' | 'archived'>('all');
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [courseToReject, setCourseToReject] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesResult, statsResult] = await Promise.all([
        getAllCoursesForAdmin(),
        getCourseStatistics()
      ]);

      if (coursesResult.success && Array.isArray(coursesResult.data)) {
        setCourses(coursesResult.data);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId: string) => {
    const confirmed = window.confirm(
      "Approve this course?\n\nThe course will be published and visible to all students in the catalog."
    );
    
    if (!confirmed) return;

    setProcessingCourseId(courseId);
    try {
      const result = await approveCourse(courseId);
      if (result.success) {
        toast.success("Course approved and published!");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to approve course");
      }
    } catch (error) {
      console.error("Error approving course:", error);
      toast.error("An error occurred while approving course");
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleReject = async (courseId: string) => {
    setCourseToReject(courseId);
    setRejectionFeedback("");
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!courseToReject) return;

    if (!rejectionFeedback || rejectionFeedback.trim().length < 10) {
      toast.error("Please provide detailed feedback (at least 10 characters)");
      return;
    }

    setProcessingCourseId(courseToReject);
    setRejectDialogOpen(false);
    
    try {
      const result = await rejectCourse(courseToReject, rejectionFeedback.trim());
      if (result.success) {
        toast.success("Course rejected with feedback sent to instructor");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to reject course");
      }
    } catch (error) {
      console.error("Error rejecting course:", error);
      toast.error("An error occurred while rejecting course");
    } finally {
      setProcessingCourseId(null);
      setCourseToReject(null);
      setRejectionFeedback("");
    }
  };

  const handleUnpublish = async (courseId: string) => {
    const confirmed = window.confirm(
      "Unpublish this course?\n\nThe course will be hidden from the catalog but existing enrollments will remain active."
    );
    
    if (!confirmed) return;

    setProcessingCourseId(courseId);
    try {
      const result = await unpublishCourse(courseId);
      if (result.success) {
        toast.success("Course unpublished");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to unpublish course");
      }
    } catch (error) {
      console.error("Error unpublishing course:", error);
      toast.error("An error occurred while unpublishing course");
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    const confirmed = window.confirm(
      "⚠️ DELETE COURSE?\n\nThis action CANNOT be undone!\n\nThe course and all its content will be permanently deleted.\nCourses with active enrollments cannot be deleted."
    );
    
    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm permanent deletion:'
    );

    if (doubleConfirm !== "DELETE") {
      toast.error("Deletion cancelled");
      return;
    }

    setProcessingCourseId(courseId);
    try {
      const result = await deleteCourseAsAdmin(courseId);
      if (result.success) {
        toast.success("Course deleted permanently");
        await fetchData();
      } else {
        toast.error(result.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("An error occurred while deleting course");
    } finally {
      setProcessingCourseId(null);
    }
  };

  const getStatusBadge = (course: Course) => {
    if (course.is_published) {
      return <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>;
    }
    
    switch (course.status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Archived</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Approved</Badge>;
      default:
        return <Badge variant="outline">{course.status}</Badge>;
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'published') return course.is_published === true;
    if (filter === 'pending') return course.status === 'pending';
    if (filter === 'rejected') return course.status === 'rejected';
    if (filter === 'archived') return course.status === 'archived';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-colors ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${filter === 'pending' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${filter === 'published' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('published')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${filter === 'rejected' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${filter === 'archived' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('archived')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold">{stats.archived}</p>
              </div>
              <Archive className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending reviews */}
      {stats.pending > 0 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Action Required:</strong> There are {stats.pending} course(s) awaiting your review.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>
            Review, approve, and manage all courses on the platform.
            {filter !== 'all' && ` Showing: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No courses found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        {course.subtitle && (
                          <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                        )}
                        {course.status === 'rejected' && course.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <p className="font-semibold text-red-700">Admin Feedback:</p>
                            <p className="text-red-600 mt-1">{course.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.instructor.full_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{course.instructor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(course.price_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(course)}
                    </TableCell>
                    <TableCell>
                      {new Date(course.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin-courses/${course.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {/* Approve/Re-publish button for non-published courses */}
                        {!course.is_published && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(course.id)}
                            disabled={processingCourseId === course.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {course.status === 'pending' ? 'Approve' : 'Re-publish'}
                          </Button>
                        )}

                        {/* Reject button - available for all courses */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(course.id)}
                          disabled={processingCourseId === course.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>

                        {/* Unpublish button for published courses */}
                        {course.is_published && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUnpublish(course.id)}
                            disabled={processingCourseId === course.id}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Unpublish
                          </Button>
                        )}

                        {/* Delete button - only for unpublished courses */}
                        {!course.is_published && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                            disabled={processingCourseId === course.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rejection Feedback Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reject Course</DialogTitle>
            <DialogDescription>
              Provide detailed feedback to help the instructor improve their course.
              This feedback will be visible to the instructor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="feedback" className="text-sm font-medium">
                Rejection Feedback *
              </label>
              <Textarea
                id="feedback"
                placeholder="Please explain why this course is being rejected and provide specific suggestions for improvement...\n\nExample:\n- The course content needs more detailed explanations\n- Missing prerequisites section\n- Video quality needs improvement\n- Add more practical examples"
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Current: {rejectionFeedback.length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setCourseToReject(null);
                setRejectionFeedback("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionFeedback || rejectionFeedback.trim().length < 10}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
