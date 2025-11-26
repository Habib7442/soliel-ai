"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createReview, updateReview } from "@/server/actions/review.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  courseId: string;
  userId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
}

export function ReviewForm({ courseId, userId, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setSubmitting(true);

    try {
      let result;
      
      if (existingReview) {
        // Update existing review
        result = await updateReview({
          reviewId: existingReview.id,
          rating,
          comment
        });
      } else {
        // Create new review
        result = await createReview({
          courseId,
          userId,
          rating,
          comment
        });
      }

      if (result.success) {
        toast.success(existingReview ? "Review updated successfully!" : "Review submitted successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? "Update Your Review" : "Write a Review"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} {rating === 1 ? "star" : "stars"}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
