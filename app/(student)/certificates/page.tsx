import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, BookOpen, CheckCircle, Download, FileText, Lock } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 pt-12 max-w-7xl relative z-10">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
               Achievements
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-4 leading-tight">
            My <span className="text-primary italic">Certificates</span>
          </h1>
          <p className="text-xl text-muted-foreground/80 font-medium leading-relaxed">
            Showcase your expertise. Earn certificates upon completing courses and mastering new skills.
          </p>
        </div>
        
        {certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="group relative bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                   {certificate.courses?.thumbnail_url ? (
                     <img 
                        src={certificate.courses.thumbnail_url} 
                        alt="Course" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                     />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Award className="h-16 w-16 text-gray-300" />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-4 left-6 right-6">
                      <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2">
                         <CheckCircle className="h-3 w-3" />
                         Completed
                      </div>
                   </div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-xl font-black text-gray-900 line-clamp-2 mb-2 leading-tight group-hover:text-primary transition-colors">
                     {certificate.courses?.title || 'Unknown Course'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-8">
                     <span className="bg-gray-100 px-2 py-1 rounded-md">Issued</span>
                     {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : 'N/A'}
                  </div>
                  
                  <Button asChild className="w-full rounded-2xl bg-gray-900 text-white font-black hover:bg-primary shadow-lg shadow-black/5 hover:shadow-primary/20 h-14">
                    <Link href={certificate.pdf_url || '#'}>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 p-16 text-center max-w-4xl mx-auto mb-20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
             
             <div className="relative z-10">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                   <Lock className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Certificates Yet</h3>
                <p className="text-lg text-muted-foreground font-medium mb-10 max-w-lg mx-auto">
                  Certificates are awarded upon 100% completion of a course. Start learning today to unlock your first award!
                </p>
                <Button asChild size="lg" className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-black px-10 h-14 shadow-xl shadow-primary/20">
                  <Link href="/courses">Browse Course Catalog</Link>
                </Button>
             </div>
          </div>
        )}
        
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 lg:p-12 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h2 className="text-2xl font-black mb-10 text-center tracking-tight">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center relative">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10 transform -rotate-3">
                   <BookOpen className="h-8 w-8" />
                 </div>
                 <h3 className="font-black text-lg mb-3">1. Complete Lessons</h3>
                 <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                   Finish all video lessons, reading materials, and labs in the course curriculum.
                 </p>
                 <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 w-12 border-t-2 border-dashed border-gray-200" />
              </div>
              
              <div className="text-center relative">
                 <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/10 transform rotate-3">
                   <FileText className="h-8 w-8" />
                 </div>
                 <h3 className="font-black text-lg mb-3">2. Pass Assessments</h3>
                 <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                   Submit all assignments and pass the final exam with a score of 80% or higher.
                 </p>
                 <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 w-12 border-t-2 border-dashed border-gray-200" />
              </div>
              
              <div className="text-center">
                 <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10 transform -rotate-2">
                   <Award className="h-8 w-8" />
                 </div>
                 <h3 className="font-black text-lg mb-3">3. Get Certified</h3>
                 <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                   Instantly download your verifiable certificate to share on LinkedIn or your resume.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}