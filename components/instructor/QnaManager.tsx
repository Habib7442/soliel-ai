"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getQnaThreads,
  getQnaMessages,
  replyToQnaThread,
  markQnaThreadAsResolved,
  pinQnaThread,
  upvoteQnaMessage,
  markAsOfficialAnswer,
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import {
  MessageCircle,
  Send,
  CheckCircle,
  Pin,
  PinOff,
  ThumbsUpIcon,
  Check,
} from "lucide-react";

interface QnaThread {
  id: string;
  title: string;
  created_at: string;
  is_resolved: boolean;
  is_pinned: boolean;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface QnaMessage {
  id: string;
  body_md: string;
  created_at: string;
  upvotes: number;
  is_official_answer: boolean;
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
  const [qnaThreads, setLocalQnaThreads] = useState<QnaThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<QnaThread | null>(null);
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
        setLocalQnaThreads(result.data as QnaThread[]);
      }
      setQnaLoadingLocal(false);
      setQnaLoading(false);
    };

    fetchThreads();
  }, [courseId, setQnaLoading]);

  const viewThread = async (thread: QnaThread) => {
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

    const result = await replyToQnaThread(
      selectedThread.id,
      userId,
      replyMessage
    );
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

  // Toggle resolved status
  const toggleResolved = async (threadId: string) => {
    const thread = qnaThreads.find((t) => t.id === threadId);
    if (!thread) return;

    const result = await markQnaThreadAsResolved(threadId, !thread.is_resolved);
    if (result.success) {
      // Update local state
      setLocalQnaThreads((threads) =>
        threads.map((t) =>
          t.id === threadId ? { ...t, is_resolved: !t.is_resolved } : t
        )
      );

      if (selectedThread && selectedThread.id === threadId) {
        setSelectedThread({
          ...selectedThread,
          is_resolved: !selectedThread.is_resolved,
        });
      }

      toast.success(
        `Thread marked as ${thread.is_resolved ? "unresolved" : "resolved"}`
      );
    } else {
      toast.error(result.error || "Failed to update thread status");
    }
  };

  // Toggle pinned status
  const togglePinned = async (threadId: string) => {
    const thread = qnaThreads.find((t) => t.id === threadId);
    if (!thread) return;

    const result = await pinQnaThread(threadId, !thread.is_pinned);
    if (result.success) {
      // Update local state
      setLocalQnaThreads((threads) =>
        threads.map((t) =>
          t.id === threadId ? { ...t, is_pinned: !t.is_pinned } : t
        )
      );

      if (selectedThread && selectedThread.id === threadId) {
        setSelectedThread({
          ...selectedThread,
          is_pinned: !selectedThread.is_pinned,
        });
      }

      toast.success(`Thread ${thread.is_pinned ? "unpinned" : "pinned"}`);
    } else {
      toast.error(result.error || "Failed to update thread pin status");
    }
  };

  // Upvote message
  const upvoteMessage = async (messageId: string) => {
    const result = await upvoteQnaMessage(messageId);
    if (result.success) {
      // Update local state
      setMessages((messages) =>
        messages.map((message) =>
          message.id === messageId
            ? { ...message, upvotes: (message.upvotes || 0) + 1 }
            : message
        )
      );

      toast.success("Message upvoted!");
    } else {
      toast.error(result.error || "Failed to upvote message");
    }
  };

  // Mark as official answer
  const markAsOfficial = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const result = await markAsOfficialAnswer(
      messageId,
      !message.is_official_answer
    );
    if (result.success) {
      // Update local state
      setMessages((messages) =>
        messages.map((m) =>
          m.id === messageId
            ? { ...m, is_official_answer: !m.is_official_answer }
            : m
        )
      );

      toast.success(
        `Message ${
          message.is_official_answer ? "unmarked" : "marked"
        } as official answer`
      );
    } else {
      toast.error(result.error || "Failed to update message status");
    }
  };

  // Sort threads: pinned first, then by date
  const sortedThreads = [...qnaThreads].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Q&A Discussions</h2>
        <p className="text-muted-foreground">
          View and respond to student questions
        </p>
      </div>

      {qnaLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Loading discussions...
            </p>
          </CardContent>
        </Card>
      ) : sortedThreads.length === 0 ? (
        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>
            No discussions yet. Students can start Q&A threads while taking the
            course.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {sortedThreads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={thread.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {thread.profiles?.full_name?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {thread.title}
                        </CardTitle>
                        {thread.is_pinned && (
                          <Badge variant="default">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {thread.is_resolved && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        by {thread.profiles?.full_name || "Anonymous"} •{" "}
                        {new Date(thread.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePinned(thread.id)}
                      title={thread.is_pinned ? "Unpin thread" : "Pin thread"}
                    >
                      {thread.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleResolved(thread.id)}
                      title={
                        thread.is_resolved
                          ? "Mark as unresolved"
                          : "Mark as resolved"
                      }
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${
                          thread.is_resolved ? "text-green-500" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewThread(thread)}
                    >
                      View Discussion
                    </Button>
                  </div>
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
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedThread?.title}</DialogTitle>
                <DialogDescription>
                  Discussion with{" "}
                  {selectedThread?.profiles?.full_name || "student"}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {selectedThread?.is_pinned && (
                  <Badge variant="default">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {selectedThread?.is_resolved && (
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loadingMessages ? (
              <p className="text-center text-muted-foreground">
                Loading messages...
              </p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No messages yet.
              </p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.profiles?.avatar_url || ""} />
                    <AvatarFallback>
                      {message.profiles?.full_name?.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {message.profiles?.full_name || "Anonymous"}
                      </span>
                      {message.profiles?.role === "instructor" && (
                        <Badge variant="default" className="text-xs">
                          Instructor
                        </Badge>
                      )}
                      {message.is_official_answer && (
                        <Badge
                          variant="default"
                          className="text-xs bg-green-500"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Official Answer
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {message.body_md}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => upvoteMessage(message.id)}
                      >
                        <ThumbsUpIcon className="h-3 w-3 mr-1" />
                        {message.upvotes || 0}
                      </Button>
                      {message.profiles?.role !== "instructor" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => markAsOfficial(message.id)}
                        >
                          {message.is_official_answer ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Official
                            </>
                          ) : (
                            "Mark as Official"
                          )}
                        </Button>
                      )}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
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
