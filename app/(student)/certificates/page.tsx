import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CertificatesPage() {
  const supabase = await createServerClient();
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch certificates for this user
  const { data: certificates, error: certificatesError } = await supabase
    .from('certificates')
    .select(`
      *,
      courses (title, thumbnail_url)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Certificates</h1>
            <p className="text-muted-foreground">Certificates unlocked upon course completion</p>
          </div>
        </div>
        
        {certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{certificate.courses?.title || 'Course Title'}</CardTitle>
                  <CardDescription>Certificate of Completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Issued on {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={certificate.pdf_url || '#'}>
                        {certificate.pdf_url ? 'Download Certificate' : 'Certificate Unavailable'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Certificates Yet</CardTitle>
              <CardDescription>Complete courses to unlock your certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Certificates are unlocked when you complete 100% of a course.
                </p>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>How Certificates Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Complete Course Content</h3>
                  <p className="text-muted-foreground text-sm">
                    Finish all lessons, labs, and assignments in the course
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Pass Final Assessment</h3>
                  <p className="text-muted-foreground text-sm">
                    Successfully complete the final quiz or project
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Get Your Certificate</h3>
                  <p className="text-muted-foreground text-sm">
                    Download your certificate immediately upon completion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}