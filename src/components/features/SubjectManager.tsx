"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Edit3, Trash2, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// SubjectManager Component
interface Subject {
  id: number;
  name: string;
  color: string;
  totalHours: number;
}

interface SubjectManagerProps {
  subjects: Subject[];
  updateSubjects: (subject: Subject) => Promise<void>;
  deleteSubject?: (subjectId: number) => Promise<void>;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  updateSubjects,
  deleteSubject: deleteSubjectProp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    color: "#3B82F6",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Keep preset colors as hardcoded values
  const presetColors = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#6366F1", // Indigo
    "#A855F7", // Purple
  ];

  const addSubject = async () => {
    if (!newSubject.name.trim()) return;

    setIsLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Insert new subject into database
      const { data, error } = await supabase
        .from("subjects")
        .insert({
          user_id: user.id,
          subject_name: newSubject.name,
          color: newSubject.color,
        })
        .select()
        .single();

      if (error) throw error;

      // Create the subject object for local state
      const subject: Subject = {
        id: data.id,
        name: data.subject_name,
        color: data.color,
        totalHours: 0,
      };

      // Update local state by calling the parent's update function
      // Note: This assumes the parent will handle adding to the array
      await updateSubjects(subject);

      // Reset form
      setNewSubject({ name: "", color: "#3B82F6" });
      setIsOpen(false);
    } catch (err) {
      console.error("Error adding subject:", err);
      alert("Failed to add subject. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const editSubject = async (subject: Subject) => {
    setIsLoading(true);
    try {
      await updateSubjects(subject);
      setEditingSubject(null);
    } catch (err) {
      console.error("Error editing subject:", err);
      alert("Failed to update subject. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubject = async (subject: Subject) => {
    setIsLoading(true);
    try {
      if (deleteSubjectProp) {
        // Use the prop function if provided
        await deleteSubjectProp(subject.id);
      } else {
        // Fallback to direct database call
        const { error } = await supabase
          .from("subjects")
          .delete()
          .eq("id", subject.id);

        if (error) throw error;

        // Refresh the page as a last resort
        window.location.reload();
      }

      setDeletingSubject(null);
    } catch (err) {
      console.error("Error deleting subject:", err);
      alert("Failed to delete subject. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Manage Subjects
          </Button>
        </DialogTrigger>
        <DialogContent className="!max-w-6xl !w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-2xl">Manage Subjects</DialogTitle>
            <DialogDescription className="text-base">
              Add, edit, or remove your study subjects.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
            {/* Left side - Add New Subject */}
            <div className="overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-accent/20 rounded-2xl border border-accent-foreground/10 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Add New Subject
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new study subject with a custom color
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="subject-name"
                      className="text-sm font-medium"
                    >
                      Subject Name
                    </Label>
                    <Input
                      id="subject-name"
                      type="text"
                      value={newSubject.name}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics, Physics, History..."
                      className="h-11 text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Choose Color
                    </Label>

                    {/* Enhanced Color Picker */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                        <div
                          className="w-12 h-12 rounded-xl border-4 border-background shadow-lg ring-1 ring-border flex-shrink-0"
                          style={{ backgroundColor: newSubject.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Custom Color
                          </Label>
                          <Input
                            type="color"
                            value={newSubject.color}
                            onChange={(e) =>
                              setNewSubject({
                                ...newSubject,
                                color: e.target.value,
                              })
                            }
                            className="w-16 h-8 p-1 border-2 cursor-pointer rounded-lg"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Preset Colors */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Quick Colors
                        </Label>
                        <div className="grid grid-cols-6 gap-2">
                          {presetColors.map((color, index) => (
                            <button
                              key={index}
                              className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm ${
                                newSubject.color === color
                                  ? "border-background ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 shadow-lg"
                                  : "border-muted hover:border-border hover:shadow-md"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() =>
                                setNewSubject({ ...newSubject, color })
                              }
                              disabled={isLoading}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={addSubject}
                    className="w-full h-11 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={!newSubject.name.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right side - Existing Subjects */}
            <div className="flex flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold mb-2">Your Subjects</h3>
                <p className="text-sm text-muted-foreground">
                  {subjects.length} subject{subjects.length !== 1 ? "s" : ""}{" "}
                  created
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center bg-muted/30 rounded-2xl border-2 border-dashed border-border/50 p-8">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-3xl mb-4">
                      📚
                    </div>
                    <h4 className="text-base font-medium mb-2">
                      No subjects yet
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                      Create your first subject using the form to get started
                      with organizing your studies!
                    </p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="group bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 transition-all duration-200 hover:bg-card hover:shadow-lg hover:border-border/80"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-12 h-12 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105 border-2 border-background/20 flex-shrink-0"
                              style={{ backgroundColor: subject.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm mb-1 truncate">
                                {subject.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {subject.totalHours}h studied
                              </div>
                            </div>
                          </div>
                          {subject.name !== "Uncategorized" && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
                                onClick={() => setEditingSubject(subject)}
                                disabled={isLoading}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletingSubject(subject)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground) / 0.3);
              border-radius: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground) / 0.5);
            }
          `}</style>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      {editingSubject && (
        <Dialog
          open={!!editingSubject}
          onOpenChange={() => setEditingSubject(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-xl">Edit Subject</DialogTitle>
              <DialogDescription>
                Make changes to your subject here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="edit-subject-name">Subject Name</Label>
                <Input
                  id="edit-subject-name"
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) =>
                    setEditingSubject({
                      ...editingSubject,
                      name: e.target.value,
                    })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4">
                <Label>Color</Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                    <div
                      className="w-12 h-12 rounded-xl border-2 border-background/20 shadow-sm"
                      style={{ backgroundColor: editingSubject.color }}
                    />
                    <Input
                      type="color"
                      value={editingSubject.color}
                      onChange={(e) =>
                        setEditingSubject({
                          ...editingSubject,
                          color: e.target.value,
                        })
                      }
                      className="w-20 h-10 p-1 border-2 cursor-pointer"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {presetColors.map((color, index) => (
                      <button
                        key={index}
                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                          editingSubject.color === color
                            ? "border-background ring-2 ring-primary ring-offset-2 scale-110"
                            : "border-muted/20 hover:border-border"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setEditingSubject({ ...editingSubject, color })
                        }
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setEditingSubject(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => editSubject(editingSubject)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingSubject}
        onOpenChange={() => setDeletingSubject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subject "{deletingSubject?.name}"
              and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSubject && deleteSubject(deletingSubject)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                "Delete Subject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
