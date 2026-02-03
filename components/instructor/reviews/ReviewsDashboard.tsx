"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, ExternalLink, Filter } from "lucide-react";
import { getInstructorReviews } from "@/server/actions/instructor-activity.actions";
import Link from "next/link";
import { replyToReview } from "@/server/actions/instructor.actions";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  course_id: string;
  course_title: string;
  rating: number;
  comment: string;
  created_at: string;
  instructor_reply?: string;
  replied_at?: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

export default function ReviewsDashboard({ instructorId }: { instructorId: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    const result = await getInstructorReviews(instructorId);
    if (result.success && result.data) {
      setReviews(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [instructorId]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    const result = await replyToReview(reviewId, replyText);
    if (result.success) {
      toast.success("Reply posted successfully");
      setReplyingTo(null);
      setReplyText("");
      fetchReviews(); // Refresh
    } else {
      toast.error("Failed to post reply");
    }
  };

  if (loading) {
    return (
       <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
             <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-3xl" />
          ))}
       </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
         <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Student <span className="text-primary italic">Voices</span></h2>
            <p className="text-muted-foreground font-medium mt-1">Manage global reviews across all your courses.</p>
         </div>
         <Button variant="outline" className="rounded-xl border-gray-200">
            <Filter className="w-4 h-4 mr-2" /> Filter
         </Button>
      </div>

      <div className="grid gap-6">
        {reviews.length === 0 ? (
           <Card className="border-4 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                 <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-gray-300">
                    <Star className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">No reviews yet</h3>
                 <p className="text-muted-foreground mt-2 max-w-xs">Once students leave feedback, it will appear here.</p>
              </CardContent>
           </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden group">
              <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between border-b border-gray-50 bg-white/50">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarImage src={review.user?.avatar_url} />
                    <AvatarFallback className="font-bold bg-primary/10 text-primary">
                       {review.user?.full_name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-bold text-lg text-gray-900">{review.user?.full_name || "Anonymous Student"}</h3>
                       <Badge variant="secondary" className="rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                          Verified Student
                       </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-200"}`} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                       Reviewed on <span className="text-gray-900 font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                
                <Badge variant="outline" className="rounded-xl px-4 py-2 bg-white/50 border-gray-100 flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-primary" />
                   <span className="text-xs font-bold text-gray-600 line-clamp-1 max-w-[150px]">{review.course_title}</span>
                </Badge>
              </CardHeader>
              
              <CardContent className="p-6 md:p-8">
                <p className="text-gray-700 leading-relaxed font-medium text-lg">
                  "{review.comment}"
                </p>

                {/* Instructor Response */}
                {review.instructor_reply ? (
                  <div className="mt-8 pl-6 border-l-4 border-primary/20">
                     <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                           Your Response
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">
                           {review.replied_at && new Date(review.replied_at).toLocaleDateString()}
                        </span>
                     </div>
                     <p className="text-gray-600 italic">
                        {review.instructor_reply}
                     </p>
                  </div>
                ) : (
                   <div className="mt-6">
                      {replyingTo === review.id ? (
                         <div className="space-y-3 p-4 bg-gray-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                            <Textarea 
                               placeholder="Write your response to this student..."
                               className="min-h-[100px] border-0 bg-white shadow-sm resize-none rounded-xl focus-visible:ring-primary"
                               value={replyText}
                               onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                               <Button size="sm" variant="ghost" className="rounded-lg font-bold text-muted-foreground hover:text-gray-900" onClick={() => setReplyingTo(null)}>Cancel</Button>
                               <Button size="sm" className="rounded-lg bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20" onClick={() => handleReply(review.id)}>
                                  Post Reply
                               </Button>
                            </div>
                         </div>
                      ) : (
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary hover:bg-primary/5 font-bold rounded-xl -ml-2"
                            onClick={() => setReplyingTo(review.id)}
                         >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Reply to Review
                         </Button>
                      )}
                   </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
