"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  getQnaThreads,
  getQnaMessages,
  replyToQnaThread
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { MessageCircle, Send } from "lucide-react";

interface QnaThreadWithProfile {
  id: string;
  title: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
  messages_count?: number;
}

interface QnaMessage {
  id: string;
  body_md: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
}

interface QnaManagerProps {
  courseId: string;
  userId: string;
}

export const QnaManager = ({ courseId, userId }: QnaManagerProps) => {
  const { setQnaLoading } = useInstructorStore();
  const [qnaThreads, setLocalQnaThreads] = useState<QnaThreadWithProfile[]>([]);
  const [selectedThread, setSelectedThread] = useState<QnaThreadWithProfile | null>(null);
  const [messages, setMessages] = useState<QnaMessage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [qnaLoading, setQnaLoadingLocal] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      setQnaLoadingLocal(true);
      setQnaLoading(true);
      const result = await getQnaThreads(courseId);
      if (result.success && result.data) {
        setLocalQnaThreads(result.data as QnaThreadWithProfile[]);
      }
      setQnaLoadingLocal(false);
      setQnaLoading(false);
    };

    fetchThreads();
  }, [courseId, setQnaLoading]);

  const viewThread = async (thread: QnaThreadWithProfile) => {
    setSelectedThread(thread);
    setIsDialogOpen(true);
    setLoadingMessages(true);
    
    const result = await getQnaMessages(thread.id);
    if (result.success && result.data) {
      setMessages(result.data as QnaMessage[]);
    }
    setLoadingMessages(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyMessage.trim() || !selectedThread) {
      toast.error("Message cannot be empty");
      return;
    }

    const result = await replyToQnaThread(selectedThread.id, userId, replyMessage);
    if (result.success) {
      toast.success("Reply sent successfully!");
      setReplyMessage("");
      
      // Refresh messages
      const updatedMessages = await getQnaMessages(selectedThread.id);
      if (updatedMessages.success && updatedMessages.data) {
        setMessages(updatedMessages.data as QnaMessage[]);
      }
    } else {
      toast.error(result.error || "Failed to send reply");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Q&A Discussions</h2>
        <p className="text-muted-foreground">View and respond to student questions</p>
      </div>

      {qnaLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading discussions...</p>
          </CardContent>
        </Card>
      ) : qnaThreads.length === 0 ? (
        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>
            No discussions yet. Students can start Q&A threads while taking the course.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {(qnaThreads as QnaThreadWithProfile[]).map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewThread(thread)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={thread.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {thread.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                      <CardDescription className="mt-1">
                        by {thread.profiles?.full_name || 'Anonymous'} • {new Date(thread.created_at).toLocaleDateString()}
                      </CardDescription>
                      {thread.messages_count && (
                        <Badge variant="secondary" className="mt-2">
                          {thread.messages_count} {thread.messages_count === 1 ? 'reply' : 'replies'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Discussion
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Thread Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedThread?.title}</DialogTitle>
            <DialogDescription>
              Discussion with {selectedThread?.profiles?.full_name || 'student'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loadingMessages ? (
              <p className="text-center text-muted-foreground">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {message.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {message.profiles?.full_name || 'Anonymous'}
                      </span>
                      {message.profiles?.role === 'instructor' && (
                        <Badge variant="default" className="text-xs">Instructor</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {message.body_md}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleReply} className="border-t pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reply">Your Reply</Label>
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
