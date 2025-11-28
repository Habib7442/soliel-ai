import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getCertificateById } from "@/server/actions/certificate.actions";
import { CertificateTemplate } from "@/components/course/CertificateTemplate";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CertificatePageProps {
  params: Promise<{
    certificateId: string;
  }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { certificateId } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch certificate data
  const result = await getCertificateById(certificateId);

  if (!result.success || !result.data) {
    redirect("/profile");
  }

  const certificate = result.data;

  // Verify ownership
  if (certificate.user_id !== user.id) {
    redirect("/profile");
  }

  // Extract data with proper type handling
  const course = (certificate as unknown as {
    courses: { title: string; thumbnail_url: string | null; profiles: { full_name: string | null } | null };
  }).courses;
  const student = (certificate as unknown as {
    profiles: { full_name: string | null };
  }).profiles;
  const instructor = course?.profiles;

  const certificateData = certificate.certificate_data || {};

  return (
    <div className="min-h-screen py-12 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>

        {/* Certificate Template */}
        <CertificateTemplate
          studentName={
            certificateData.student_name ||
            student?.full_name ||
            user.email ||
            "Student"
          }
          courseName={certificateData.course_title || course?.title || "Course"}
          instructorName={
            certificateData.instructor_name || instructor?.full_name || "Instructor"
          }
          completionDate={certificate.completion_date || certificate.issued_at}
          certificateNumber={certificate.certificate_number}
          verificationCode={certificate.verification_code}
        />
      </div>
    </div>
  );
}
