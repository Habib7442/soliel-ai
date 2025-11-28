"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, CheckCircle } from "lucide-react";

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
    <div className="space-y-4">
      {/* Action Buttons - Hidden when printing */}
      <div className="flex gap-3 justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Certificate
        </Button>
        <Button onClick={handlePrint}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Certificate Container */}
      <div
        ref={certificateRef}
        className="certificate-container bg-white shadow-2xl print:shadow-none"
      >
        {/* Decorative Border */}
        <div className="certificate-border">
          {/* Certificate Content */}
          <div className="certificate-content">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-serif font-bold text-gray-800 mb-2">
                Certificate of Completion
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
            </div>

            {/* Body */}
            <div className="text-center space-y-8 my-12">
              <p className="text-lg text-gray-600">This is to certify that</p>

              <h2 className="text-4xl font-serif font-bold text-gray-900 border-b-2 border-gray-300 pb-2 inline-block px-12">
                {studentName}
              </h2>

              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                has successfully completed the course
              </p>

              <h3 className="text-3xl font-semibold text-gray-800 px-8">
                {courseName}
              </h3>

              <p className="text-lg text-gray-600">
                Instructed by{" "}
                <span className="font-semibold text-gray-800">
                  {instructorName}
                </span>
              </p>

              <div className="flex justify-center items-center gap-2 text-gray-600">
                <span>Completed on</span>
                <span className="font-semibold text-gray-800">
                  {formatDate(completionDate)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 border-t border-gray-200 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Signature Section */}
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 pt-2 inline-block min-w-[200px]">
                    <p className="text-sm font-semibold text-gray-800">
                      {instructorName}
                    </p>
                    <p className="text-xs text-gray-600">Course Instructor</p>
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="text-center md:text-right space-y-1">
                  <p className="text-xs text-gray-600">
                    Certificate No:{" "}
                    <span className="font-mono font-semibold text-gray-800">
                      {certificateNumber}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Verification Code:{" "}
                    <span className="font-mono font-semibold text-gray-800">
                      {verificationCode}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    Verify at: yourplatform.com/verify
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-blue-200 opacity-50"></div>
            <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-purple-200 opacity-50"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-container,
          .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            box-shadow: none !important;
          }
        }

        .certificate-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          aspect-ratio: 1.414 / 1; /* A4 ratio */
          page-break-after: always;
        }

        .certificate-border {
          width: 100%;
          height: 100%;
          border: 8px double #d4af37;
          padding: 40px;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #f8f9fa 50%,
            #ffffff 100%
          );
          position: relative;
        }

        .certificate-content {
          width: 100%;
          height: 100%;
          padding: 60px 40px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        @media (max-width: 768px) {
          .certificate-border {
            padding: 20px;
          }
          .certificate-content {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
