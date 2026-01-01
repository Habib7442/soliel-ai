"use server";

import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Types
export interface Company {
  id: string;
  name: string;
  email: string;
  billing_email: string | null;
  plan: "basic" | "enterprise" | "custom";
  seat_limit: number;
  active_seats: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: "company_admin" | "employee";
  invitation_token: string;
  expires_at: string;
  accepted_at: string | null;
  created_by: string;
  created_at: string;
}

// Helper to check if user is super admin
async function isSuperAdmin(userId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "super_admin";
}

// Helper to check if user is company admin
async function isCompanyAdmin(userId: string, companyId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", userId)
    .single();
  return (
    data?.company_id === companyId && data?.role === "company_admin"
  );
}

/**
 * Get all companies (Super Admin only)
 */
export async function getAllCompanies() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (!(await isSuperAdmin(user.id))) {
      return { success: false, error: "Unauthorized - Super Admin only" };
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching companies:", error);
    return { success: false, error: "Failed to fetch companies" };
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has access to this company
    const isAdmin = await isSuperAdmin(user.id);
    const isCompAdmin = await isCompanyAdmin(user.id, companyId);

    if (!isAdmin && !isCompAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching company:", error);
    return { success: false, error: "Failed to fetch company" };
  }
}

/**
 * Create a new company (Super Admin only)
 */
export async function createCompany(companyData: {
  name: string;
  email: string;
  billing_email?: string;
  plan?: "basic" | "enterprise" | "custom";
  seat_limit?: number;
  admin_email: string;
  admin_name: string;
}) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (!(await isSuperAdmin(user.id))) {
      return { success: false, error: "Unauthorized - Super Admin only" };
    }

    // Generate secure token as temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex'); // 32 characters

    // Create auth account for company admin with temporary password
    // Use admin client (service role) for auth.admin operations
    const adminClient = await createAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: companyData.admin_email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: companyData.admin_name,
      },
    });

    if (authError) {
      return { success: false, error: `Failed to create admin account: ${authError.message}` };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create admin account" };
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyData.name,
        email: companyData.email,
        billing_email: companyData.billing_email || companyData.email,
        plan: companyData.plan || "basic",
        seat_limit: companyData.seat_limit || 10,
      })
      .select()
      .single();

    if (companyError) {
      // Rollback: Delete auth user if company creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: companyError.message };
    }

    // IMPORTANT: Upsert profile directly with company_admin role
    // The trigger may have already created it with 'student' role, so we upsert
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: companyData.admin_email,
        full_name: companyData.admin_name,
        role: "company_admin",
        company_id: company.id,
        company_role: "company_admin",
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      // Rollback: Delete both company and auth user
      await supabase.from("companies").delete().eq("id", company.id);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: `Failed to link admin to company: ${profileError.message}` };
    }

    // Send welcome email with login credentials
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const loginUrl = `${baseUrl}/sign-in`;

      const { error: emailError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: companyData.admin_email,
        options: {
          redirectTo: loginUrl,
        },
      });

      if (emailError) {
        console.error("Failed to send welcome email:", emailError.message);
        // Don't fail the whole operation, admin can still login with token
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue even if email fails
    }

    revalidatePath("/admin-companies");
    return { 
      success: true, 
      data: company, 
      tempPassword, // Return temporary password to show in UI
      adminEmail: companyData.admin_email,
    };
  } catch (error) {
    console.error("Error creating company:", error);
    return { success: false, error: "Failed to create company" };
  }
}

/**
 * Update company (Super Admin only)
 */
export async function updateCompany(
  companyId: string,
  updates: {
    name?: string;
    email?: string;
    billing_email?: string;
    plan?: "basic" | "enterprise" | "custom";
    seat_limit?: number;
    is_active?: boolean;
  }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (!(await isSuperAdmin(user.id))) {
      return { success: false, error: "Unauthorized - Super Admin only" };
    }

    const { data, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin-companies");
    return { success: true, data };
  } catch (error) {
    console.error("Error updating company:", error);
    return { success: false, error: "Failed to update company" };
  }
}

/**
 * Permanently delete company from database (Super Admin only)
 * WARNING: This is a hard delete and cannot be undone!
 */
export async function deleteCompany(companyId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (!(await isSuperAdmin(user.id))) {
      return { success: false, error: "Unauthorized - Super Admin only" };
    }

    // HARD DELETE - Permanently remove from database
    // Cascade will automatically delete:
    // - company_invitations (ON DELETE CASCADE)
    // - profiles.company_id will be set to NULL (ON DELETE SET NULL)
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin-companies");
    return { success: true };
  } catch (error) {
    console.error("Error deleting company:", error);
    return { success: false, error: "Failed to delete company" };
  }
}

/**
 * Get company employees
 */
export async function getCompanyEmployees(companyId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check access
    const isAdmin = await isSuperAdmin(user.id);
    const isCompAdmin = await isCompanyAdmin(user.id, companyId);

    if (!isAdmin && !isCompAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, company_role, updated_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { success: false, error: "Failed to fetch employees" };
  }
}

/**
 * Invite employee to company
 */
export async function inviteEmployee(
  companyId: string,
  email: string,
  role: "company_admin" | "employee" = "employee"
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check access
    const isAdmin = await isSuperAdmin(user.id);
    const isCompAdmin = await isCompanyAdmin(user.id, companyId);

    if (!isAdmin && !isCompAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if company has available seats
    const { data: company } = await supabase
      .from("companies")
      .select("seat_limit, active_seats")
      .eq("id", companyId)
      .single();

    if (company && company.active_seats >= company.seat_limit) {
      return {
        success: false,
        error: "Seat limit reached. Upgrade plan to add more employees.",
      };
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: "User already exists. Use a different email.",
      };
    }

    // Create invitation
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("company_invitations")
      .insert({
        company_id: companyId,
        email,
        role,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Send invitation email using Supabase Admin Client
    try {
      const adminClient = await createAdminClient();
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const invitationLink = `${baseUrl}/accept-invitation?token=${invitationToken}`;

      // Note: Supabase doesn't automatically send emails for invitations
      // You would need to implement email sending using a service like Resend, SendGrid, etc.
      // For now, we'll return the invitation link in the success response
      console.log("Invitation link generated:", invitationLink);
      console.log("Send this link to:", email);
    } catch (emailError) {
      console.error("Error generating invitation link:", emailError);
    }

    return { success: true, data, invitationToken, invitationLink: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/accept-invitation?token=${invitationToken}` };
  } catch (error) {
    console.error("Error inviting employee:", error);
    return { success: false, error: "Failed to invite employee" };
  }
}

/**
 * Accept company invitation
 */
export async function acceptInvitation(invitationToken: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from("company_invitations")
      .select("*, companies(name)")
      .eq("invitation_token", invitationToken)
      .single();

    if (invError || !invitation) {
      return { success: false, error: "Invalid invitation token" };
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: "Invitation has expired" };
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return { success: false, error: "Invitation already accepted" };
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        company_id: invitation.company_id,
        company_role: invitation.role,
      })
      .eq("id", user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Mark invitation as accepted
    await supabase
      .from("company_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    // Increment active seats
    await supabase.rpc("increment_company_seats", {
      company_id_param: invitation.company_id,
    });

    return { success: true, data: invitation };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, error: "Failed to accept invitation" };
  }
}

/**
 * Remove employee from company
 */
export async function removeEmployee(companyId: string, employeeId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check access
    const isAdmin = await isSuperAdmin(user.id);
    const isCompAdmin = await isCompanyAdmin(user.id, companyId);

    if (!isAdmin && !isCompAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    // Remove company association
    const { error } = await supabase
      .from("profiles")
      .update({ company_id: null, company_role: null })
      .eq("id", employeeId)
      .eq("company_id", companyId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Decrement active seats
    await supabase.rpc("decrement_company_seats", {
      company_id_param: companyId,
    });

    revalidatePath(`/company-dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Error removing employee:", error);
    return { success: false, error: "Failed to remove employee" };
  }
}

/**
 * Get company info for company admin
 */
export async function getCompanyInfo(userId: string) {
  try {
    const supabase = await createServerClient();

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: "No company associated" };
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching company info:", error);
    return { success: false, error: "Failed to fetch company info" };
  }
}

/**
 * Get courses assigned to company employees
 */
export async function getCompanyAssignedCourses(userId: string) {
  try {
    const supabase = await createServerClient();

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: "No company associated" };
    }

    // Get all employees of the company
    const { data: employees } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", profile.company_id);

    if (!employees || employees.length === 0) {
      return { success: true, data: [] };
    }

    const employeeIds = employees.map((e) => e.id);

    // Get all enrollments for company employees
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        user_id,
        course_id,
        created_at,
        courses(
          id,
          title,
          description,
          thumbnail_url,
          price_cents
        )
      `)
      .in("user_id", employeeIds)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching company courses:", error);
    return { success: false, error: "Failed to fetch company courses" };
  }
}

/**
 * Get company billing information
 */
export async function getCompanyBillingInfo(userId: string) {
  try {
    const supabase = await createServerClient();

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: "No company associated" };
    }

    const { data, error } = await supabase
      .from("companies")
      .select(`
        plan,
        seat_limit,
        active_seats,
        billing_email,
        created_at
      `)
      .eq("id", profile.company_id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Format billing info
    const billingInfo = {
      plan: data.plan,
      seat_limit: data.seat_limit,
      active_seats: data.active_seats,
      billing_email: data.billing_email,
      billing_period: "Monthly", // Default for now
      due_date: null, // Would come from Stripe subscription
      amount: data.plan === "enterprise" ? 499 : 99, // Mock pricing
    };

    return { success: true, data: [billingInfo] };
  } catch (error) {
    console.error("Error fetching billing info:", error);
    return { success: false, error: "Failed to fetch billing info" };
  }
}
