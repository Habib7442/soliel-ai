"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
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
  Pencil,
  Trash2,
  Building2,
  Users,
  TrendingUp,
  Loader2,
  Copy,
  CheckCircle,
  Mail,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  type Company,
} from "@/server/actions/company.actions";

interface CompanyFormData {
  name: string;
  email: string;
  billing_email: string;
  plan: "basic" | "enterprise" | "custom";
  seat_limit: number;
  admin_email: string;
  admin_name: string;
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");

  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    email: "",
    billing_email: "",
    plan: "basic",
    seat_limit: 10,
    admin_email: "",
    admin_name: "",
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const result = await getAllCompanies();
      if (result.success) {
        setCompanies(result.data || []);
      } else {
        toast.error(result.error || "Failed to load companies");
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        email: company.email,
        billing_email: company.billing_email || "",
        plan: company.plan,
        seat_limit: company.seat_limit,
        admin_email: "",
        admin_name: "",
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        email: "",
        billing_email: "",
        plan: "basic",
        seat_limit: 10,
        admin_email: "",
        admin_name: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Company name and email are required");
      return;
    }

    if (!editingCompany && (!formData.admin_email.trim() || !formData.admin_name.trim())) {
      toast.error("Admin email and name are required for new companies");
      return;
    }

    setSubmitting(true);

    try {
      if (editingCompany) {
        // Update existing company
        const result = await updateCompany(editingCompany.id, {
          name: formData.name,
          email: formData.email,
          billing_email: formData.billing_email,
          plan: formData.plan,
          seat_limit: formData.seat_limit,
        });

        if (result.success) {
          toast.success("Company updated successfully!");
          setDialogOpen(false);
          loadCompanies();
        } else {
          toast.error(result.error || "Failed to update company");
        }
      } else {
        // Create new company
        const result = await createCompany(formData);

        if (result.success) {
          toast.success("Company created successfully!");
          setDialogOpen(false);
                  
          // Show login credentials dialog
          if (result.tempPassword && result.adminEmail) {
            setTempPassword(result.tempPassword);
            setCurrentAdminEmail(result.adminEmail);
            setShowInvitationDialog(true);
          }
                  
          loadCompanies();
        } else {
          toast.error(result.error || "Failed to create company");
        }
      }
    } catch (error) {
      console.error("Error submitting company:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        setCopied(true);
        toast.success("Password copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Failed to copy password");
      }
    }
  };

  const handleSendEmail = () => {
    if (tempPassword && currentAdminEmail) {
      const subject = encodeURIComponent("Your Company Admin Account Credentials");
      const body = encodeURIComponent(
        `Hi,\n\n` +
        `Your company admin account has been created successfully!\n\n` +
        `Login Credentials:\n` +
        `Email: ${currentAdminEmail}\n` +
        `Temporary Password: ${tempPassword}\n\n` +
        `Login URL: ${window.location.origin}/sign-in\n\n` +
        `IMPORTANT: Please change your password immediately after logging in for security reasons.\n\n` +
        `Best regards`
      );
      window.open(`mailto:${currentAdminEmail}?subject=${subject}&body=${body}`, "_blank");
    }
  };

  const handleToggleActive = async (companyId: string, companyName: string, currentStatus: boolean) => {
    const action = currentStatus ? "deactivate" : "activate";
    if (
      !confirm(
        `Are you sure you want to ${action} "${companyName}"? ${currentStatus ? "This will prevent new logins but preserve data." : "This will reactivate the company."}`
      )
    ) {
      return;
    }

    try {
      const result = await updateCompany(companyId, {
        is_active: !currentStatus,
      });

      if (result.success) {
        toast.success(`Company ${action}d successfully`);
        loadCompanies();
      } else {
        toast.error(result.error || `Failed to ${action} company`);
      }
    } catch (error) {
      console.error("Error toggling company status:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handlePermanentDelete = async (companyId: string, companyName: string) => {
    if (
      !confirm(
        `⚠️ PERMANENT DELETE WARNING!

Are you absolutely sure you want to PERMANENTLY DELETE "${companyName}"?

This will:
- Delete the company record
- Remove all employee associations
- Delete all company invitations
- This action CANNOT be undone!

Type the company name to confirm.`
      )
    ) {
      return;
    }

    // Double confirmation
    const confirmName = prompt(
      `To confirm permanent deletion, please type the company name: "${companyName}"`
    );

    if (confirmName !== companyName) {
      toast.error("Company name doesn't match. Deletion cancelled.");
      return;
    }

    try {
      const result = await deleteCompany(companyId);

      if (result.success) {
        toast.success("Company permanently deleted");
        loadCompanies();
      } else {
        toast.error(result.error || "Failed to delete company");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
      </div>
    );
  }

  const activeCompanies = companies.filter((c) => c.is_active).length;
  const totalSeats = companies.reduce((sum, c) => sum + c.seat_limit, 0);
  const activeSeats = companies.reduce((sum, c) => sum + c.active_seats, 0);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Management</h1>
            <p className="text-muted-foreground">
              Manage corporate accounts and employee enrollments
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-[#FF0000] to-[#CC0000]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>
                    {editingCompany ? "Edit Company" : "Create New Company"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCompany
                      ? "Update company details"
                      : "Create a new company account. The admin will receive an invitation email."}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-6 overflow-y-auto flex-1 px-1">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>

                  {/* Company Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Company Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="contact@acme.com"
                      required
                    />
                  </div>

                  {/* Billing Email */}
                  <div className="space-y-2">
                    <Label htmlFor="billing_email">Billing Email</Label>
                    <Input
                      id="billing_email"
                      type="email"
                      value={formData.billing_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billing_email: e.target.value,
                        })
                      }
                      placeholder="billing@acme.com"
                    />
                  </div>

                  {/* Plan */}
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value: "basic" | "enterprise" | "custom") =>
                        setFormData({ ...formData, plan: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seat Limit */}
                  <div className="space-y-2">
                    <Label htmlFor="seat_limit">Seat Limit</Label>
                    <Input
                      id="seat_limit"
                      type="number"
                      min="1"
                      value={formData.seat_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seat_limit: parseInt(e.target.value) || 10,
                        })
                      }
                    />
                  </div>

                  {/* Admin Details (only for new companies) */}
                  {!editingCompany && (
                    <>
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-4">Company Admin Details</h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="admin_name">Admin Name *</Label>
                            <Input
                              id="admin_name"
                              value={formData.admin_name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  admin_name: e.target.value,
                                })
                              }
                              placeholder="John Doe"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="admin_email">Admin Email *</Label>
                            <Input
                              id="admin_email"
                              type="email"
                              value={formData.admin_email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  admin_email: e.target.value,
                                })
                              }
                              placeholder="john@acme.com"
                              required
                            />
                            
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <DialogFooter className="flex-shrink-0 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
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
                        Saving...
                      </>
                    ) : (
                      <>{editingCompany ? "Update Company" : "Create Company"}</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Companies
                  </p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-[#FF0000]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Companies
                  </p>
                  <p className="text-2xl font-bold">{activeCompanies}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Seats
                  </p>
                  <p className="text-2xl font-bold">{totalSeats}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Seats
                  </p>
                  <p className="text-2xl font-bold">{activeSeats}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>
              Manage corporate accounts and their subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first company account to get started
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Company
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {company.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {company.active_seats} / {company.seat_limit}
                      </TableCell>
                      <TableCell>
                        {company.is_active ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(company)}
                            title="Edit company"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleActive(company.id, company.name, company.is_active)
                            }
                            title={company.is_active ? "Deactivate company" : "Activate company"}
                          >
                            {company.is_active ? (
                              <ToggleRight className="w-4 h-4 text-red-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handlePermanentDelete(company.id, company.name)
                            }
                            title="Permanently delete company"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Login Credentials Dialog */}
        <AlertDialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Company Admin Account Created
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  The company admin account has been created. Share these login credentials:
                </p>
                
                {/* Login Email */}
                <div className="bg-muted p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-semibold">Email:</Label>
                  </div>
                  <code className="text-xs bg-background p-2 rounded border block">
                    {currentAdminEmail}
                  </code>
                </div>

                {/* Temporary Password */}
                <div className="bg-muted p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-semibold">Temporary Password:</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto">
                      {tempPassword}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPassword}
                      className="shrink-0"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-900 dark:text-red-100">
                    <strong>Important:</strong> Admin should change this password after first login at /sign-in
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSendEmail}
                className="w-full sm:w-auto"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send via Email
              </Button>
              <AlertDialogAction onClick={() => setShowInvitationDialog(false)}>
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
