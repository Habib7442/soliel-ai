"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, MessageCircle, CheckCircle2, Clock, FileText, ArrowRight } from "lucide-react";
import { getInstructorQnaThreads, getPendingAssignments } from "@/server/actions/instructor-activity.actions";
import { getQnaMessages, replyToQnaThread } from "@/server/actions/instructor.actions";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";

interface QnaItem {
  id: string;
  title: string;
  course_title: string;
  created_at: string;
  is_resolved: boolean;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface MessageItem {
  id: string;
  body_md: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

interface AssignmentItem {
  id: string;
  assignment_title: string;
  course_title: string;
  course_id: string;
  submitted_at: string;
  student: {
    full_name: string;
    avatar_url: string;
  };
}

export default function ActivityDashboard({ instructorId }: { instructorId: string }) {
  const [qnaThreads, setQnaThreads] = useState<QnaItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Q&A State
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [qnaRes, assignRes] = await Promise.all([
      getInstructorQnaThreads(instructorId, 'all'),
      getPendingAssignments(instructorId)
    ]);

    if (qnaRes.success && qnaRes.data) setQnaThreads(qnaRes.data);
    if (assignRes.success && assignRes.data) setAssignments(assignRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const handleExpandThread = async (threadId: string) => {
    if (expandedThreadId === threadId) {
      setExpandedThreadId(null);
      return;
    }
    
    setExpandedThreadId(threadId);
    setMessagesLoading(true);
    
    const res = await getQnaMessages(threadId);
    if (res.success && res.data) {
      // Map to correct shape
      const formattedMessages = res.data.map((msg: any) => ({
        ...msg,
        user_id: msg.user_id || msg.profiles?.id, // Fallback
        profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
      }));
      setThreadMessages(formattedMessages);
    }
    
    setMessagesLoading(false);
  };

  const handleReplyThread = async (threadId: string) => {
    if (!replyText.trim()) return;
    
    // Optimistic UI update could go here
    const res = await replyToQnaThread(threadId, instructorId, replyText);
    
    if (res.success) {
      // Refresh messages
      const msgs = await getQnaMessages(threadId);
      if (msgs.success && msgs.data) {
        const formattedMessages = msgs.data.map((msg: any) => ({
          ...msg,
          user_id: msg.user_id || msg.profiles?.id,
          profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
        }));
        setThreadMessages(formattedMessages);
      }
      setReplyText("");
    }
  };

  if (loading) {
    return (
       <div className="space-y-6">
          <div className="h-12 w-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="grid gap-4">
             {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-3xl" />
             ))}
          </div>
       </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
         <h2 className="text-3xl font-black text-gray-900 tracking-tight">Student <span className="text-primary italic">Activity</span></h2>
         <p className="text-muted-foreground font-medium mt-1">Track questions and grade pending assignments.</p>
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="h-14 p-1 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-2xl mb-8">
          <TabsTrigger value="assignments" className="h-full rounded-xl px-6 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
            <FileText className="w-4 h-4 mr-2" />
            Pending Assignments
            {assignments.length > 0 && (
               <Badge className="ml-2 bg-primary text-white hover:bg-primary border-0 rounded-full px-2 min-w-[20px] h-5 flex items-center justify-center">
                  {assignments.length}
               </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="qna" className="h-full rounded-xl px-6 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
            <MessageCircle className="w-4 h-4 mr-2" />
            Q&A Threads
            {qnaThreads.filter(t => !t.is_resolved).length > 0 && (
               <Badge className="ml-2 bg-red-100 text-red-600 hover:bg-red-200 border-0 rounded-full px-2 min-w-[20px] h-5 flex items-center justify-center">
                  {qnaThreads.filter(t => !t.is_resolved).length}
               </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {assignments.length === 0 ? (
             <Card className="border-4 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                   <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-gray-300">
                      <CheckCircle2 className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                   <p className="text-muted-foreground mt-2 max-w-xs">No pending assignments to grade right now.</p>
                </CardContent>
             </Card>
          ) : (
            assignments.map((item) => (
              <Card key={item.id} className="group border-0 bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                     <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                        <AvatarImage src={item.student?.avatar_url} />
                        <AvatarFallback className="font-bold bg-primary/10 text-primary">{item.student?.full_name?.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{item.student?.full_name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">Submitted <span className="text-gray-900 font-bold">"{item.assignment_title}"</span></p>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              {item.course_title}
                           </Badge>
                           <span className="text-[10px] font-bold text-gray-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(item.submitted_at).toLocaleDateString()}
                           </span>
                        </div>
                     </div>
                  </div>
                  
                  <Button asChild className="rounded-xl px-6 h-12 bg-gray-900 hover:bg-primary text-white font-bold shadow-lg shadow-gray-200 hover:shadow-primary/20 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${item.course_id}/assignments`}>
                        Grade Submission <ArrowRight className="w-4 h-4 ml-2" />
                     </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="qna" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {qnaThreads.length === 0 ? (
             <Card className="border-4 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                   <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-gray-300">
                      <MessageCircle className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">Quiet for now</h3>
                   <p className="text-muted-foreground mt-2 max-w-xs">No questions have been asked recently.</p>
                </CardContent>
             </Card>
          ) : (
            qnaThreads.map((thread) => (
              <Card key={thread.id} className="group border-0 bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                     <div className={`w-2 rounded-full h-12 transition-colors ${thread.is_resolved ? 'bg-green-200' : 'bg-yellow-400'}`} />
                     
                     <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                           <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{thread.title}</h3>
                           {thread.is_resolved ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 rounded-lg text-[10px] font-bold uppercase tracking-wider">Resolved</Badge>
                           ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0 rounded-lg text-[10px] font-bold uppercase tracking-wider">Open</Badge>
                           )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <Avatar className="h-6 w-6">
                              <AvatarImage src={thread.user?.avatar_url} />
                              <AvatarFallback className="text-[10px]">{thread.user?.full_name?.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span className="text-sm font-bold text-gray-600">{thread.user?.full_name}</span>
                           <span className="text-gray-300 text-xs">•</span>
                           <span className="text-xs font-medium text-muted-foreground">in <span className="text-gray-900 font-bold">{thread.course_title}</span></span>
                        </div>
                     </div>
                     
                     <Button 
                        variant="ghost" 
                        onClick={() => handleExpandThread(thread.id)}
                        className="rounded-xl px-4 h-10 font-bold text-muted-foreground hover:text-primary hover:bg-primary/5"
                     >
                        {expandedThreadId === thread.id ? 'Collapse' : 'View Thread'}
                     </Button>
                  </div>
                  
                  {/* Expanded Thread View */}
                  {expandedThreadId === thread.id && (
                    <div className="bg-gray-50/50 border-t border-gray-100 p-6 animate-in fade-in slide-in-from-top-1">
                       {messagesLoading ? (
                          <div className="space-y-3">
                             <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-3/4" />
                             <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-1/2" />
                          </div>
                       ) : (
                          <div className="space-y-6">
                             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {threadMessages.map((msg) => (
                                   <div key={msg.id} className={`flex gap-3 ${msg.profiles?.role === 'instructor' ? 'flex-row-reverse' : ''}`}>
                                      <Avatar className="h-8 w-8 mt-1">
                                         <AvatarImage src={msg.profiles?.avatar_url} />
                                         <AvatarFallback className="text-xs">{msg.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className={`rounded-2xl p-3 max-w-[80%] ${msg.profiles?.role === 'instructor' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white shadow-sm rounded-tl-sm'}`}>
                                         <p className="text-xs font-bold mb-1 opacity-70">{msg.profiles?.full_name}</p>
                                         <p className="text-sm leading-relaxed">{msg.body_md}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                             
                             <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                                <Textarea 
                                   placeholder="Type your reply..." 
                                   className="min-h-[40px] border-0 focus-visible:ring-0 resize-none bg-transparent"
                                   value={replyText}
                                   onChange={(e) => setReplyText(e.target.value)}
                                />
                                <Button 
                                   size="sm" 
                                   className="h-auto rounded-xl bg-gray-900 hover:bg-primary px-4"
                                   onClick={() => handleReplyThread(thread.id)}
                                >
                                   Send
                                </Button>
                             </div>
                          </div>
                       )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
