"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  getCourseReviews,
  updateReviewStatus
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { Star, Eye, EyeOff, Flag } from "lucide-react";

interface ReviewsManagerProps {
  courseId: string;
}

export const ReviewsManager = ({ courseId }: ReviewsManagerProps) => {
  const { reviews, setReviews, reviewsLoading, setReviewsLoading } = useInstructorStore();
  const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden' | 'flagged'>('all');

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
  }, [courseId]);

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

  const filteredReviews = filterStatus === 'all' 
    ? reviews 
    : reviews.filter(review => review.status === filterStatus);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Reviews</h2>
          <p className="text-muted-foreground">View and manage course feedback</p>
        </div>
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
            {filterStatus === 'all' 
              ? 'No reviews yet. Students will see a prompt to leave a review after completing the course.'
              : `No ${filterStatus} reviews found.`}
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
                        {review.student_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{review.student_name || 'Anonymous'}</h4>
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
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
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
