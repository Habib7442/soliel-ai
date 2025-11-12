"use server";

import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { revalidatePath } from "next/cache";

export interface CreateUserParams {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role?: UserRole;
  bio?: string;
}

export interface UpdateUserRoleParams {
  userId: string;
  role: UserRole;
}

export interface UpdateUserParams {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
}

export const createUserProfile = async (params: CreateUserParams) => {
  try {
    const supabase = await createServerClient();
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.id)
      .single();

    if (existingProfile) {
      // Profile already exists, update it instead
      const { data, error } = await supabase
        .from('profiles')
        .update({
          email: params.email,
          full_name: params.fullName,
          avatar_url: params.avatarUrl,
          role: params.role,
          bio: params.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: `Failed to update profile: ${error.message}` };
      }

      return { success: true, data };
    }

    // Create new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: params.id,
        email: params.email,
        full_name: params.fullName,
        avatar_url: params.avatarUrl,
        role: params.role || UserRole.STUDENT,
        bio: params.bio
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return { success: false, error: `Failed to create profile: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return { success: false, error: 'Failed to create profile' };
  }
};

export const updateUserRole = async ({ userId, role }: UpdateUserRoleParams) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: `Failed to update user role: ${error.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return { success: false, error: 'Failed to update user role' };
  }
};

export const getAllUsers = async () => {
  try {
    const supabase = await createServerClient();
    
    // Fetch all users
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: `Failed to fetch users: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
};

export const updateUserProfile = async (params: UpdateUserParams) => {
  try {
    const supabase = await createServerClient();
    
    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: params.fullName,
        avatar_url: params.avatarUrl,
        bio: params.bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: `Failed to update user profile: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: 'Failed to update user profile' };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Fetch user profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: `Failed to fetch user profile: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { success: false, error: 'Failed to fetch user profile' };
  }
};