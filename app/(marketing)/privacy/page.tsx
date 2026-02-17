"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-20 bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Last updated: February 17, 2026
          </p>
        </div>

        <div className="grid gap-8">
          <Card className="border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-8">
              <div className="flex items-center gap-4 text-primary">
                <ShieldCheck className="w-8 h-8" />
                <CardTitle className="text-2xl font-bold">Introduction</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 text-gray-600 leading-relaxed space-y-4">
              <p>
                At Soliel AI Academy, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our services.
              </p>
              <p>
                By using our platform, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-8">
              <div className="flex items-center gap-4 text-primary">
                <Eye className="w-8 h-8" />
                <CardTitle className="text-2xl font-bold">Information Collection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 text-gray-600 leading-relaxed space-y-4">
              <p>
                We collect several different types of information for various purposes to provide and improve our Service to you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Data:</strong> Email address, first and last name, profile picture.</li>
                <li><strong>Usage Data:</strong> Course progress, quiz results, and interaction with AI tools.</li>
                <li><strong>Cookies:</strong> We use cookies to maintain your session and preferences.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-8">
              <div className="flex items-center gap-4 text-primary">
                <Lock className="w-8 h-8" />
                <CardTitle className="text-2xl font-bold">Data Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 text-gray-600 leading-relaxed space-y-4">
              <p>
                The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
              </p>
              <p>
                We strive to use commercially acceptable means to protect your Personal Data, including encryption and secure authentication through Supabase.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-8">
              <div className="flex items-center gap-4 text-primary">
                <FileText className="w-8 h-8" />
                <CardTitle className="text-2xl font-bold">Your Rights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 text-gray-600 leading-relaxed space-y-4">
              <p>
                You have the right to access, update, or delete the information we have on you. Whenever made possible, you can update your Personal Data directly within your account settings section.
              </p>
              <p>
                If you are unable to perform these actions yourself, please contact us to assist you.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
