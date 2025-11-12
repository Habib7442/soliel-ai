"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Company-related actions
export const getCompanyInfo = async (userId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        description,
        website,
        created_at
      `)
      .eq('admin_id', userId)
      .single();

    if (error) {
      console.error('Error fetching company info:', error);
      return { success: false, error: `Failed to fetch company info: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCompanyInfo:', error);
    return { success: false, error: 'Failed to fetch company info' };
  }
};

export const getCompanyAssignedCourses = async (companyId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('company_course_assignments')
      .select(`
        id,
        assigned_at,
        courses (
          id,
          title,
          description,
          price
        )
      `)
      .eq('company_id', companyId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned courses:', error);
      return { success: false, error: `Failed to fetch assigned courses: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCompanyAssignedCourses:', error);
    return { success: false, error: 'Failed to fetch assigned courses' };
  }
};

export const getCompanyEmployees = async (companyId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('company_employees')
      .select(`
        id,
        joined_at,
        user_profiles (
          full_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return { success: false, error: `Failed to fetch employees: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCompanyEmployees:', error);
    return { success: false, error: 'Failed to fetch employees' };
  }
};

export const getCompanyBillingInfo = async (companyId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('company_billing')
      .select(`
        id,
        amount,
        billing_period,
        due_date,
        status
      `)
      .eq('company_id', companyId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('Error fetching billing info:', error);
      return { success: false, error: `Failed to fetch billing info: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCompanyBillingInfo:', error);
    return { success: false, error: 'Failed to fetch billing info' };
  }
};

export const assignCourseToCompany = async (companyId: string, courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('company_course_assignments')
      .insert({
        company_id: companyId,
        course_id: courseId,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning course to company:', error);
      return { success: false, error: `Failed to assign course: ${error.message}` };
    }

    revalidatePath('/company-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in assignCourseToCompany:', error);
    return { success: false, error: 'Failed to assign course' };
  }
};

export const addEmployeeToCompany = async (companyId: string, userId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('company_employees')
      .insert({
        company_id: companyId,
        user_id: userId,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding employee to company:', error);
      return { success: false, error: `Failed to add employee: ${error.message}` };
    }

    revalidatePath('/company-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in addEmployeeToCompany:', error);
    return { success: false, error: 'Failed to add employee' };
  }
};