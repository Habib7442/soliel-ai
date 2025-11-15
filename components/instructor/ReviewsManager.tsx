"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  getCourseReviews,
  updateReviewStatus,
  replyToReview
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { Star, Eye, EyeOff, Flag, Send, Filter } from "lucide-react";

interface ReviewsManagerProps {
  courseId: string;
}

interface ReviewFormData {
  instructor_response: string;
}

export const ReviewsManager = ({ courseId }: ReviewsManagerProps) => {
  const { reviews, setReviews, reviewsLoading, setReviewsLoading } = useInstructorStore();
  const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden' | 'flagged'>('all');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState<ReviewFormData>({
    instructor_response: ""
  });

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      const result = await getCourseReviews(courseId);
      if (result.success && result.data) {
        setReviews(result.data);
      }
      setReviewsLoading(false);
    };

    fetchReviews();
  }, [courseId, setReviews, setReviewsLoading]);

  const handleStatusChange = async (reviewId: string, status: 'visible' | 'hidden' | 'flagged') => {
    const result = await updateReviewStatus(reviewId, status);
    if (result.success) {
      toast.success(`Review ${status === 'visible' ? 'shown' : status === 'hidden' ? 'hidden' : 'flagged'}!`);
      const updatedReviews = await getCourseReviews(courseId);
      if (updatedReviews.success && updatedReviews.data) {
        setReviews(updatedReviews.data);
      }
    } else {
      toast.error(result.error || "Failed to update review status");
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyForm.instructor_response.trim()) {
      toast.error("Response cannot be empty");
      return;
    }

    const result = await replyToReview(reviewId, replyForm.instructor_response);
    if (result.success) {
      toast.success("Response sent successfully!");
      setReplyingTo(null);
      setReplyForm({ instructor_response: "" });
      const updatedReviews = await getCourseReviews(courseId);
      if (updatedReviews.success && updatedReviews.data) {
        setReviews(updatedReviews.data);
      }
    } else {
      toast.error(result.error || "Failed to send response");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews
    .filter(review => filterStatus === 'all' || review.status === filterStatus)
    .filter(review => filterRating === 'all' || review.rating === filterRating);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Student Reviews</h2>
          <p className="text-muted-foreground">View and manage course feedback</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterStatus}
            onValueChange={(value: typeof filterStatus) => setFilterStatus(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={String(filterRating)}
            onValueChange={(value) => setFilterRating(value === 'all' ? 'all' : Number(value))}
          >
            <SelectTrigger className="w-32">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Rating" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <div className="flex">
                {renderStars(Math.round(averageRating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reviews.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Visible Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {reviews.filter(r => r.status === 'visible').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Flagged Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {reviews.filter(r => r.status === 'flagged').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviewsLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading reviews...</p>
          </CardContent>
        </Card>
      ) : filteredReviews.length === 0 ? (
        <Alert>
          <AlertDescription>
            {filterStatus === 'all' && filterRating === 'all'
              ? 'No reviews yet. Students will see a prompt to leave a review after completing the course.'
              : `No reviews found matching your filters.`}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar>
                      <AvatarImage src={review.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {review.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{review.profiles?.full_name || 'Anonymous'}</h4>
                        <Badge variant={
                          review.status === 'visible' ? 'default' :
                          review.status === 'flagged' ? 'destructive' : 'secondary'
                        }>
                          {review.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}

                      {/* Instructor Response */}
                      {review.instructor_response && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Your Response:</span>
                          </div>
                          <p className="text-sm">{review.instructor_response}</p>
                          {review.responded_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Responded on {new Date(review.responded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Reply Form */}
                      {replyingTo === review.id && (
                        <div className="mt-4 p-3 border rounded-lg">
                          <Label htmlFor={`reply-${review.id}`} className="mb-2 block">Your Response</Label>
                          <Textarea
                            id={`reply-${review.id}`}
                            value={replyForm.instructor_response}
                            onChange={(e) => setReplyForm({ ...replyForm, instructor_response: e.target.value })}
                            placeholder="Write your response to this review..."
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => setReplyingTo(null)} variant="outline">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleReplySubmit(review.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Send Response
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {review.status !== 'visible' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(review.id, 'visible')}
                        title="Show review"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {review.status !== 'hidden' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(review.id, 'hidden')}
                        title="Hide review"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    {review.status !== 'flagged' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(review.id, 'flagged')}
                        title="Flag review"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                    {!review.instructor_response && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(review.id);
                          setReplyForm({ instructor_response: "" });
                        }}
                        title="Reply to review"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};