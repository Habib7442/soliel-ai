"use client";

import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole } from "@/server/actions/user.actions";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRole } from "@/types/enums";
import { Shield, Users, Building, Crown } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export default function UsersPage() {
  const { session, loading: authLoading } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success && Array.isArray(result.data)) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Confirm super admin promotion
    if (newRole === UserRole.SUPER_ADMIN) {
      const confirmed = window.confirm(
        "⚠️ WARNING: You are about to grant Super Admin privileges.\n\n" +
        "Super Admins have full access to:\n" +
        "• All user data and role management\n" +
        "• Course approval and deletion\n" +
        "• Bundle creation and pricing\n" +
        "• Payment and financial data\n" +
        "• Platform-wide settings\n\n" +
        "Are you absolutely sure you want to proceed?"
      );
      
      if (!confirmed) {
        return;
      }
    }

    setUpdatingUserId(userId);
    try {
      const result = await updateUserRole({ userId, role: newRole });
      if (result.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success(`User role updated to ${newRole.replace('_', ' ')}`);
      } else {
        toast.error(result.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("An error occurred while updating user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Crown className="h-4 w-4" />;
      case UserRole.INSTRUCTOR:
        return <Shield className="h-4 w-4" />;
      case UserRole.COMPANY_ADMIN:
        return <Building className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "bg-red-500 text-white hover:bg-red-600";
      case UserRole.INSTRUCTOR:
        return "bg-blue-500 text-white hover:bg-blue-600";
      case UserRole.COMPANY_ADMIN:
        return "bg-purple-500 text-white hover:bg-purple-600";
      default:
        return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be signed in to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please sign in to access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const superAdminCount = users.filter(u => u.role === UserRole.SUPER_ADMIN).length;
  const instructorCount = users.filter(u => u.role === UserRole.INSTRUCTOR).length;
  const studentCount = users.filter(u => u.role === UserRole.STUDENT).length;
  const companyAdminCount = users.filter(u => u.role === UserRole.COMPANY_ADMIN).length;

  return (
    <div className="container mx-auto py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold">{superAdminCount}</p>
              </div>
              <Crown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instructors</p>
                <p className="text-2xl font-bold">{instructorCount}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{studentCount}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert for Super Admins */}
      {superAdminCount > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <Crown className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Security Notice:</strong> There are currently {superAdminCount} Super Admin(s) with full platform access. 
            Only grant this role to absolutely trusted individuals.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Be careful when assigning Super Admin roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p>Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "N/A"}</p>
                        {user.id === session?.user?.id && (
                          <Badge variant="outline" className="text-xs mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          {user.role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.id === session?.user?.id ? (
                        <span className="text-sm text-muted-foreground">Current User</span>
                      ) : updatingUserId === user.id ? (
                        <Button variant="outline" disabled size="sm">
                          Updating...
                        </Button>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="company_admin">Company Admin</SelectItem>
                            <SelectItem value="super_admin">
                              <span className="flex items-center gap-2 text-red-600 font-semibold">
                                <Crown className="h-4 w-4" />
                                Super Admin ⚠️
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}