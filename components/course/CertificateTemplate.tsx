"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, CheckCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificateTemplateProps {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  certificateNumber: string;
  verificationCode: string;
}

export function CertificateTemplate({
  studentName,
  courseName,
  instructorName,
  completionDate,
  certificateNumber,
  verificationCode,
}: CertificateTemplateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end print:hidden">
        <p className="text-sm text-muted-foreground self-center mr-auto">
          Tip: Select &quot;Save as PDF&quot; in the print destination to download.
        </p>
        <Button onClick={handlePrint} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white border-0">
          <Printer className="h-4 w-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Certificate Preview Container */}
      <div className="overflow-hidden rounded-lg shadow-2xl bg-gray-50 dark:bg-gray-900 border">
        {/* Actual Certificate Node */}
        <div
          ref={certificateRef}
          className="certificate-container bg-white text-gray-900 relative"
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
             <Award className="w-[600px] h-[600px] text-gray-900" />
          </div>

          {/* Golden Border Frame */}
          <div className="h-full w-full p-8 md:p-12 relative flex flex-col">
            <div className="h-full w-full border-4 border-double border-amber-400 p-2 relative">
               <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500" />
               <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500" />
               <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500" />
               <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500" />
               
               <div className="h-full w-full border border-amber-200 bg-white/50 backdrop-blur-sm flex flex-col justify-between p-8 md:p-16 relative z-10">
                  
                  {/* Header */}
                  <div className="text-center">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 blur-xl opacity-20 rounded-full" />
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg relative z-10">
                          <CheckCircle className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
                      Certificate of Completion
                    </h1>
                    <div className="flex items-center justify-center gap-4">
                       <div className="h-px w-12 bg-amber-400" />
                       <span className="text-amber-600 font-medium uppercase tracking-widest text-sm">Official Certification</span>
                       <div className="h-px w-12 bg-amber-400" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="text-center space-y-8 my-8 flex-1 flex flex-col justify-center">
                    <p className="text-xl text-gray-600 italic font-serif">This is to certify that</p>

                    <div className="relative inline-block mx-auto px-8">
                       <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 pb-2 relative z-10">
                         {studentName}
                       </h2>
                       <div className="h-3 w-full bg-amber-100 absolute bottom-1 left-0 -z-0 opacity-50 skew-x-12" />
                    </div>

                    <p className="text-xl text-gray-600 italic font-serif max-w-2xl mx-auto">
                      has successfully completed the course
                    </p>

                    <h3 className="text-3xl font-serif font-semibold text-gray-800 px-4">
                      {courseName}
                    </h3>

                    <div className="flex flex-col items-center gap-2 mt-4">
                      <p className="text-lg text-gray-600">
                        Instructed by <span className="font-semibold text-gray-900">{instructorName}</span>
                      </p>
                      <p className="text-md text-gray-500">
                        Date of Completion: <span className="font-semibold text-gray-900 border-b border-gray-300 pb-0.5">{formatDate(completionDate)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="text-center md:text-left">
                       <div className="w-48 border-b-2 border-gray-400 mb-2" />
                       <p className="font-serif font-bold text-lg text-gray-900">{instructorName}</p>
                       <p className="text-xs uppercase tracking-wider text-gray-500">Instructor Signature</p>
                    </div>

                    <div className="text-center md:text-right">
                       {/* QR Code Placeholder or Seal could go here */}
                       <div className="flex flex-col items-center md:items-end gap-1">
                          <p className="text-xs text-gray-500">Certificate ID: <span className="font-mono text-gray-700">{certificateNumber}</span></p>
                          <p className="text-xs text-gray-500">Verification: <span className="font-mono text-gray-700">{verificationCode}</span></p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white;
            margin: 0;
            padding: 0;
          }

          /* Use visibility hidden instead of display none */
          /* This allows the certificate (which is a child) to still be "rendered" but we hide everything else */
          body * {
            visibility: hidden;
          }

          /* Make the certificate and all its children visible */
          .certificate-container, 
          .certificate-container * {
             visibility: visible !important;
             print-color-adjust: exact;
             -webkit-print-color-adjust: exact;
          }

          .certificate-container {
             position: fixed !important;
             top: 0 !important;
             left: 0 !important;
             width: 100vw !important;
             height: 100vh !important;
             z-index: 999999 !important;
             margin: 0 !important;
             padding: 0 !important;
             background: white !important;
             
             /* Restore flex layout behavior if it was affected */
             display: flex !important;
             align-items: center;
             justify-content: center;
          }
        }
        
        .certificate-container {
           width: 100%;
           aspect-ratio: 1.414/1; /* Landscape A4 approx */
           margin: 0 auto;
           background-image: radial-gradient(circle at center, #ffffff 0%, #fefcf5 100%);
        }
      `}</style>
    </div>
  );
}
