"use client";

import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  rating: number;
  comment: string;
  instructor_reply: string | null;
  replied_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to review this course!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            {/* Review Header */}
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={review.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {review.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.profiles?.full_name || "Anonymous"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Review Comment */}
                <p className="text-sm leading-relaxed">{review.comment}</p>
                
                {/* Instructor Reply */}
                {review.instructor_reply && (
                  <div className="mt-4 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Instructor Response
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.replied_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.instructor_reply}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
