"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Users,
  UserPlus,
  Mail,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCompanyEmployees,
  inviteEmployee,
  removeEmployee,
  getCompanyInfo,
} from "@/server/actions/company.actions";
import { createBrowserClient } from "@supabase/ssr";

interface Employee {
  id: string;
  full_name: string | null;
  email: string;
  company_role: string | null;
  updated_at: string;
}

interface CompanyInvitation {
  id: string;
  email: string;
  role: "company_admin" | "employee";
  invitation_token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  seat_limit: number;
  active_seats: number;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "employee" as "company_admin" | "employee",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user using client-side Supabase
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      // Get user's company ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        toast.error("No company associated with your account");
        setLoading(false);
        return;
      }

      // Load company info
      const companyResult = await getCompanyInfo(user.id);
      if (companyResult.success) {
        setCompany(companyResult.data);
      }

      // Load employees
      const employeesResult = await getCompanyEmployees(profile.company_id);
      if (employeesResult.success) {
        setEmployees(employeesResult.data || []);
      } else {
        toast.error(employeesResult.error || "Failed to load employees");
      }

      // Load pending invitations
      const { data: invitationsData, error: invError } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("company_id", profile.company_id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (!invError && invitationsData) {
        setInvitations(invitationsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!company) {
      toast.error("Company information not loaded");
      return;
    }

    // Check seat limit
    if (company.active_seats >= company.seat_limit) {
      toast.error(
        `Seat limit reached (${company.active_seats}/${company.seat_limit}). Upgrade your plan to add more employees.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        toast.error("No company associated");
        return;
      }

      const result = await inviteEmployee(
        profile.company_id,
        inviteForm.email,
        inviteForm.role
      );

      if (result.success) {
        const invitationLink = result.invitationLink;
        
        // Show success with option to copy link or send email
        toast.success(
          `Invitation created for ${inviteForm.email}!`,
          {
            duration: 8000,
            action: {
              label: "Copy Link",
              onClick: () => {
                if (invitationLink) {
                  navigator.clipboard.writeText(invitationLink);
                  toast.success("Link copied to clipboard!");
                }
              },
            },
          }
        );
        
        // Also offer to send via default email client
        const subject = encodeURIComponent("You're invited to join our company");
        const body = encodeURIComponent(
          `You've been invited to join our company!\n\n` +
          `Click this link to accept: ${invitationLink}\n\n` +
          `This invitation expires in 7 days.`
        );
        
        // Ask if they want to send via email
        const sendEmail = confirm(
          `Invitation created! Would you like to send it via your email client?`
        );
        
        if (sendEmail) {
          window.open(`mailto:${inviteForm.email}?subject=${subject}&body=${body}`, "_blank");
        }
        
        setInviteDialogOpen(false);
        setInviteForm({ email: "", role: "employee" });
        loadData(); // Reload data
      } else {
        toast.error(result.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting employee:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove || !company) return;

    setSubmitting(true);

    try {
      const result = await removeEmployee(company.id, employeeToRemove.id);

      if (result.success) {
        toast.success(
          `${employeeToRemove.full_name || employeeToRemove.email} has been removed from the company`
        );
        setRemoveDialogOpen(false);
        setEmployeeToRemove(null);
        loadData();
      } else {
        toast.error(result.error || "Failed to remove employee");
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to cancel the invitation for ${email}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase
        .from("company_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) {
        toast.error("Failed to cancel invitation");
      } else {
        toast.success("Invitation cancelled");
        loadData();
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleResendInvitation = async (email: string, role: "company_admin" | "employee") => {
    setSubmitting(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return;

      // Delete old invitation and create new one
      await supabase
        .from("company_invitations")
        .delete()
        .eq("company_id", profile.company_id)
        .eq("email", email);

      const result = await inviteEmployee(profile.company_id, email, role);

      if (result.success) {
        const invitationLink = result.invitationLink;
        
        toast.success("Invitation resent successfully!", {
          duration: 8000,
          action: {
            label: "Copy Link",
            onClick: () => {
              if (invitationLink) {
                navigator.clipboard.writeText(invitationLink);
                toast.success("Link copied to clipboard!");
              }
            },
          },
        });
        
        // Offer to send via email
        const subject = encodeURIComponent("You're invited to join our company");
        const body = encodeURIComponent(
          `You've been invited to join our company!\n\n` +
          `Click this link to accept: ${invitationLink}\n\n` +
          `This invitation expires in 7 days.`
        );
        
        const sendEmail = confirm(
          `Invitation link created! Send via your email client?`
        );
        
        if (sendEmail) {
          window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
        }
        
        loadData();
      } else {
        toast.error(result.error || "Failed to resend invitation");
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => !inv.accepted_at);
  const expiredInvitations = pendingInvitations.filter(
    (inv) => new Date(inv.expires_at) < new Date()
  );
  const availableSeats = company ? company.seat_limit - company.active_seats : 0;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Employee Management</h1>
            <p className="text-muted-foreground">
              Manage your team members and send invitations
            </p>
          </div>
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="bg-gradient-to-r from-[#FF0000] to-[#CC0000]"
            disabled={availableSeats <= 0}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Employee
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <Users className="w-8 h-8 text-[#FF0000]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Seats Used
                  </p>
                  <p className="text-2xl font-bold">
                    {company?.active_seats || 0} / {company?.seat_limit || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Available Seats
                  </p>
                  <p className="text-2xl font-bold">{availableSeats}</p>
                </div>
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Invites
                  </p>
                  <p className="text-2xl font-bold">{pendingInvitations.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seat Limit Warning */}
        {availableSeats <= 0 && (
          <Card className="mb-8 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm font-medium">
                  Seat limit reached! Upgrade your plan to invite more employees.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations sent but not yet accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => {
                    const isExpired = new Date(invitation.expires_at) < new Date();
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {invitation.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-600">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleResendInvitation(invitation.email, invitation.role)
                              }
                              disabled={submitting}
                              title="Resend invitation"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCancelInvitation(invitation.id, invitation.email)
                              }
                              title="Cancel invitation"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              All employees with access to your company account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
                <p className="text-muted-foreground mb-6">
                  Invite your first team member to get started
                </p>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Employee
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.full_name || "N/A"}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={employee.company_role === "company_admin" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {employee.company_role?.replace("_", " ") || "Employee"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEmployeeToRemove(employee);
                            setRemoveDialogOpen(true);
                          }}
                          title="Remove employee"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Invite Employee Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleInviteEmployee}>
              <DialogHeader>
                <DialogTitle>Invite Employee</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your company. They will receive an
                  email with login instructions.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="invite_email">Email Address *</Label>
                  <Input
                    id="invite_email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    placeholder="employee@example.com"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="invite_role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value: "company_admin" | "employee") =>
                      setInviteForm({ ...inviteForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="company_admin">Company Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Company admins can manage employees and view reports
                  </p>
                </div>

                {/* Available Seats Info */}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Available seats:</strong> {availableSeats} of{" "}
                    {company?.seat_limit || 0}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#FF0000] to-[#CC0000]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Remove Employee Confirmation Dialog */}
        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{" "}
                <strong>
                  {employeeToRemove?.full_name || employeeToRemove?.email}
                </strong>{" "}
                from your company?
                <br />
                <br />
                They will lose access to all company courses and data. This action
                can be reversed by re-inviting them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveEmployee}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Employee"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}