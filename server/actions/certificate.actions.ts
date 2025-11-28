"use server";

import { createServerClient } from "@/lib/supabase-server";
import { createClient } from "@/lib/supabase-client";

interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  completion_date: string;
  certificate_data: {
    student_name: string;
    course_title: string;
    instructor_name: string;
    instructor_signature?: string;
    completion_percentage: number;
  };
  created_at: string;
}

/**
 * Generate a certificate for a student who completed a course
 */
export const generateCertificate = async (
  userId: string,
  courseId: string
): Promise<{ success: boolean; data?: Certificate; error?: string }> => {
  try {
    const supabase = await createServerClient();

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (existing) {
      return { success: true, data: existing };
    }

    // Get student info
    const { data: student } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get course and instructor info
    const { data: course } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        instructor_id,
        profiles:instructor_id (
          full_name,
          avatar_url
        )
      `)
      .eq("id", courseId)
      .single();

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // Get enrollment to check completion
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("created_at, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!enrollment) {
      return { success: false, error: "Enrollment not found" };
    }

    // Get completion percentage from view
    const { data: progressData } = await supabase
      .from("v_course_progress")
      .select("progress_percent")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    const completionPercentage = progressData?.progress_percent || 0;

    // Only issue certificate if 100% complete
    if (completionPercentage < 100) {
      return {
        success: false,
        error: "Course must be 100% complete to receive certificate",
      };
    }

    const instructor = Array.isArray(course.profiles)
      ? course.profiles[0]
      : course.profiles;

    // Create certificate
    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: courseId,
        issued_at: new Date().toISOString(),
        completion_date: enrollment.completed_at || new Date().toISOString(),
        certificate_data: {
          student_name: student.full_name || student.email || "Student",
          course_title: course.title,
          instructor_name: instructor?.full_name || "Instructor",
          instructor_signature: instructor?.avatar_url,
          completion_percentage: completionPercentage,
        },
      })
      .select()
      .single();

    if (certError) {
      console.error("Error creating certificate:", certError);
      return { success: false, error: "Failed to create certificate" };
    }

    // Update enrollment to mark as completed
    await supabase
      .from("enrollments")
      .update({
        status: "completed",
        completed_at: enrollment.completed_at || new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);

    return { success: true, data: certificate };
  } catch (error) {
    console.error("Error in generateCertificate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

interface CertificateWithCourse extends Certificate {
  courses: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
}

/**
 * Get all certificates for a user
 */
export const getUserCertificates = async (
  userId: string
): Promise<{ success: boolean; data?: CertificateWithCourse[]; error?: string }> => {
  try {
    const supabase = await createServerClient();

    const { data: certificates, error } = await supabase
      .from("certificates")
      .select(`
        *,
        courses (
          id,
          title,
          thumbnail_url,
          profiles:instructor_id (
            full_name
          )
        )
      `)
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error("Error fetching certificates:", error);
      return { success: false, error: "Failed to fetch certificates" };
    }

    return { success: true, data: certificates || [] };
  } catch (error) {
    console.error("Error in getUserCertificates:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Get a single certificate by ID
 */
export const getCertificateById = async (
  certificateId: string
): Promise<{ success: boolean; data?: Certificate; error?: string }> => {
  try {
    const supabase = await createServerClient();

    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(`
        *,
        courses (
          title,
          thumbnail_url,
          profiles:instructor_id (
            full_name,
            avatar_url
          )
        ),
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq("id", certificateId)
      .single();

    if (error) {
      console.error("Error fetching certificate:", error);
      return { success: false, error: "Certificate not found" };
    }

    return { success: true, data: certificate };
  } catch (error) {
    console.error("Error in getCertificateById:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

interface VerifiedCertificate {
  id: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  completion_date: string;
  certificate_data: {
    student_name: string;
    course_title: string;
    instructor_name: string;
    completion_percentage: number;
  };
  courses: {
    title: string;
    thumbnail_url: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
}

/**
 * Verify a certificate by verification code (public - no auth required)
 */
export const verifyCertificate = async (
  verificationCode: string
): Promise<{ success: boolean; data?: VerifiedCertificate; error?: string }> => {
  try {
    const supabase = createClient();

    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(`
        id,
        certificate_number,
        verification_code,
        issued_at,
        completion_date,
        certificate_data,
        courses (
          title,
          thumbnail_url
        ),
        profiles:user_id (
          full_name
        )
      `)
      .eq("verification_code", verificationCode.toUpperCase())
      .single();

    if (error || !certificate) {
      return { success: false, error: "Invalid verification code" };
    }

    // Transform the data to match the interface (Supabase returns arrays for relations)
    const transformedCertificate: VerifiedCertificate = {
      id: certificate.id,
      certificate_number: certificate.certificate_number,
      verification_code: certificate.verification_code,
      issued_at: certificate.issued_at,
      completion_date: certificate.completion_date,
      certificate_data: certificate.certificate_data,
      courses: Array.isArray(certificate.courses) && certificate.courses.length > 0
        ? certificate.courses[0]
        : null,
      profiles: Array.isArray(certificate.profiles) && certificate.profiles.length > 0
        ? certificate.profiles[0]
        : null,
    };

    return { success: true, data: transformedCertificate };
  } catch (error) {
    console.error("Error in verifyCertificate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Check if user has completed a course and auto-generate certificate if needed
 */
export const checkAndGenerateCertificate = async (
  userId: string,
  courseId: string
): Promise<{ success: boolean; data?: Certificate; error?: string }> => {
  try {
    const supabase = await createServerClient();

    // Check if course has certificates enabled
    const { data: course } = await supabase
      .from("courses")
      .select("enable_certificates")
      .eq("id", courseId)
      .single();

    if (!course?.enable_certificates) {
      return { success: false, error: "Certificates not enabled for this course" };
    }

    // Check completion percentage
    const { data: progressData } = await supabase
      .from("v_course_progress")
      .select("progress_percent")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    const completionPercentage = progressData?.progress_percent || 0;

    if (completionPercentage >= 100) {
      // Auto-generate certificate
      return await generateCertificate(userId, courseId);
    }

    return {
      success: false,
      error: `Course is ${completionPercentage}% complete. Must reach 100% to earn certificate.`,
    };
  } catch (error) {
    console.error("Error in checkAndGenerateCertificate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};
