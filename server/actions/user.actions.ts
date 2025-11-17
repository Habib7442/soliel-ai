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
    
    // First, try to get auth users list with service role
    let authUsersMap: Record<string, string> = {};
    
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        authUsersMap = authData.users.reduce((acc, user) => {
          acc[user.id] = user.created_at;
          return acc;
        }, {} as Record<string, string>);
      }
    } catch (authError) {
      console.log('Could not fetch auth users (service role may be required):', authError);
      // Continue without auth data
    }
    
    // Fetch all profiles
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: `Failed to fetch users: ${error.message}`, data: [] };
    }

    // Merge profile data with auth created_at
    const usersWithCreatedAt = data?.map(user => {
      const createdAt = authUsersMap[user.id] || user.updated_at;
      return {
        ...user,
        created_at: createdAt
      };
    }) || [];

    // Sort by created_at descending
    usersWithCreatedAt.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { success: true, data: usersWithCreatedAt };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return { success: false, error: 'Failed to fetch users', data: [] };
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