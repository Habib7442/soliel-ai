"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQStatus,
} from "@/server/actions/faq.actions";
import type { FAQ } from "@/types/db";

export default function AdminFAQClient() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    display_order: 0,
    is_active: true,
  });

  // Load FAQs
  useEffect(() => {
    loadFAQs();
  }, []);

  // Filter FAQs
  useEffect(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.category.toLowerCase().includes(query)
      );
    }

    setFilteredFaqs(filtered);
  }, [faqs, searchQuery, selectedCategory]);

  const loadFAQs = async () => {
    setLoading(true);
    console.log('🔍 Loading FAQs...');
    const result = await getAllFAQs();
    console.log('📊 getAllFAQs result:', result);
    if (result.success && result.data) {
      console.log('✅ FAQs loaded successfully:', result.data.length, 'FAQs');
      setFaqs(result.data);
    } else {
      console.error('❌ Failed to load FAQs:', result.error);
      toast.error(result.error || "Failed to load FAQs");
    }
    setLoading(false);
  };

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        display_order: faq.display_order,
        is_active: faq.is_active,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: "",
        answer: "",
        category: "",
        display_order: 0,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      category: "",
      display_order: 0,
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      if (editingFaq) {
        // Update existing FAQ
        const result = await updateFAQ(editingFaq.id, formData);
        if (result.success) {
          toast.success("FAQ updated successfully");
          loadFAQs();
          handleCloseDialog();
        } else {
          toast.error(result.error || "Failed to update FAQ");
        }
      } else {
        // Create new FAQ
        const result = await createFAQ(formData);
        if (result.success) {
          toast.success("FAQ created successfully");
          loadFAQs();
          handleCloseDialog();
        } else {
          toast.error(result.error || "Failed to create FAQ");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    const result = await deleteFAQ(id);
    if (result.success) {
      toast.success("FAQ deleted successfully");
      loadFAQs();
    } else {
      toast.error(result.error || "Failed to delete FAQ");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleFAQStatus(id, !currentStatus);
    if (result.success) {
      toast.success(`FAQ ${!currentStatus ? "activated" : "deactivated"}`);
      loadFAQs();
    } else {
      toast.error(result.error || "Failed to toggle FAQ status");
    }
  };

  const categories = ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FAQ Management</h1>
        <p className="text-muted-foreground">
          Manage frequently asked questions for your platform
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-gradient-to-r from-[#FF0000] to-[#CC0000]" : ""}
            >
              {category}
              {category !== "All" && (
                <Badge variant="secondary" className="ml-2">
                  {faqs.filter((faq) => faq.category === category).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      ) : filteredFaqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== "All"
                ? "No FAQs found matching your filters"
                : "No FAQs yet. Create your first FAQ to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id} className={!faq.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{faq.category}</Badge>
                      <Badge variant="secondary">Order: {faq.display_order}</Badge>
                      {!faq.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(faq.id, faq.is_active)}
                      title={faq.is_active ? "Deactivate" : "Activate"}
                    >
                      {faq.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(faq)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(faq.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="whitespace-pre-wrap">
                  {faq.answer}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? "Edit FAQ" : "Create New FAQ"}
            </DialogTitle>
            <DialogDescription>
              {editingFaq
                ? "Update the FAQ details below"
                : "Add a new frequently asked question"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Enter the question..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Enter the answer..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Payments & Billing"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible to public)
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
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
                    {editingFaq ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{editingFaq ? "Update FAQ" : "Create FAQ"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
