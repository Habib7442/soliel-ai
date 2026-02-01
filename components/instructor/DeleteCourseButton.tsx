"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteCourse } from "@/server/actions/instructor.actions";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteCourseButtonProps {
  courseId: string;
  className?: string; // Add className prop for flexibility
}

export const DeleteCourseButton = ({ courseId, className }: DeleteCourseButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCourse(courseId);
    
    if (result.success) {
      toast.success("Course deleted successfully!");
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete course");
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className={className || "h-14 w-14 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 border-0 shadow-lg shadow-red-500/5"}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[2.5rem] border-0 bg-white/95 backdrop-blur-2xl shadow-2xl p-8 max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-2">
            <Trash2 className="w-8 h-8" />
          </div>
          <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
            Delete <span className="text-red-600 italic">Course?</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
            This action is permanent. All lessons, quizzes, and student progress associated with this course will be <span className="text-gray-900 font-bold underline decoration-red-500/30">lost forever.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting} className="h-14 rounded-xl border-gray-100 font-bold hover:bg-gray-50">
            Keep Course
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-14 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 border-0 shadow-xl shadow-red-600/20"
          >
            {isDeleting ? "Eliminating..." : "Yes, Delete Everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

