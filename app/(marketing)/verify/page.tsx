"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield, Search, Award, Calendar } from "lucide-react";
import { verifyCertificate } from "@/server/actions/certificate.actions";

export default function VerifyPage() {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    verified: boolean;
    data?: {
      certificate_number: string;
      issued_at: string;
      completion_date: string;
      certificate_data: {
        student_name: string;
        course_title: string;
        completion_percentage: number;
      };
      courses: {
        title: string;
      } | null;
    };
    error?: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setLoading(true);
    setResult(null);

    const response = await verifyCertificate(verificationCode.trim());

    if (response.success && response.data) {
      setResult({
        verified: true,
        data: response.data,
      });
    } else {
      setResult({
        verified: false,
        error: response.error || "Invalid verification code",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen py-16 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Certificate Verification
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify the authenticity of certificates issued by our platform. Enter the verification code to confirm the certificate&apos;s validity.
          </p>
        </div>

        {/* Verification Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Verification Code
            </CardTitle>
            <CardDescription>
              The verification code can be found on the certificate document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex gap-3">
              <Input
                type="text"
                placeholder="e.g., A1B2C3D4E5F6"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                className="flex-1 font-mono text-lg"
                maxLength={20}
              />
              <Button type="submit" disabled={loading || !verificationCode.trim()} size="lg">
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {result.verified && result.data ? (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-green-900 dark:text-green-100">
                        Certificate Verified ✓
                      </CardTitle>
                      <CardDescription className="text-green-700 dark:text-green-300">
                        This is a valid certificate issued by our platform
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Certificate Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Student Name</label>
                        <p className="text-lg font-semibold mt-1">
                          {result.data.certificate_data.student_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Course</label>
                        <p className="text-lg font-semibold mt-1">
                          {result.data.courses?.title || result.data.certificate_data.course_title}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Certificate Number
                        </label>
                        <p className="text-lg font-mono font-semibold mt-1">
                          {result.data.certificate_number}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Issued On
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {new Date(result.data.issued_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completion Badge */}
                  <div className="flex items-center justify-center pt-4 border-t">
                    <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600">
                      {result.data.certificate_data.completion_percentage}% Course Completion
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  <strong>Verification Failed</strong>
                  <p className="mt-1">{result.error || "The verification code you entered is invalid or does not exist."}</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info Section */}
        {!result && (
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              How Verification Works
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Each certificate has a unique verification code printed on it</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Enter the code above to instantly verify authenticity</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Verified certificates show student name, course details, and issue date</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
