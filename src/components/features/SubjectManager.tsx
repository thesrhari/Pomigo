"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, Flame } from "lucide-react";

// SubjectManager Component
interface Subject {
  id: number;
  name: string;
  color: string;
  icon: string;
  totalHours: number;
}

interface SubjectManagerProps {
  subjects: Subject[];
  updateSubjects: (subjects: Subject[]) => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  updateSubjects,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    color: "#3B82F6",
    icon: "📚",
  });

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];
  const icons = ["📚", "🔬", "💻", "🎨", "📐", "🧪", "📖", "✏️", "🔍", "🌍"];

  const addSubject = () => {
    if (newSubject.name.trim()) {
      const subject: Subject = {
        id: Date.now(),
        name: newSubject.name,
        color: newSubject.color,
        icon: newSubject.icon,
        totalHours: 0,
      };
      updateSubjects([...subjects, subject]);
      setNewSubject({ name: "", color: "#3B82F6", icon: "📚" });
      setIsOpen(false);
    }
  };

  const editSubject = (subject: Subject) => {
    const updated = subjects.map((s) => (s.id === subject.id ? subject : s));
    updateSubjects(updated);
    setEditingSubject(null);
  };

  const deleteSubject = (id: number) => {
    updateSubjects(subjects.filter((s) => s.id !== id));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Manage Subjects
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Subjects</DialogTitle>
            <DialogDescription>
              Add, edit, or remove study subjects.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Add New Subject */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Subject</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject-name">Subject Name</Label>
                  <Input
                    id="subject-name"
                    type="text"
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 border-muted transition-all hover:scale-110 ${
                            newSubject.color === color
                              ? "scale-110 ring-2 ring-primary ring-offset-2"
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() =>
                            setNewSubject({ ...newSubject, color })
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {icons.map((icon) => (
                        <Button
                          key={icon}
                          variant={
                            newSubject.icon === icon ? "default" : "outline"
                          }
                          size="sm"
                          className="w-10 h-10 p-0 text-lg"
                          onClick={() => setNewSubject({ ...newSubject, icon })}
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={addSubject} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </CardContent>
            </Card>

            {/* Existing Subjects */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Existing Subjects
              </h3>
              {subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No subjects yet. Add your first subject above!
                </div>
              ) : (
                subjects.map((subject) => (
                  <Card key={subject.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{subject.icon}</div>
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subject.totalHours}h studied
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSubject(subject)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteSubject(subject.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      {editingSubject && (
        <Dialog
          open={!!editingSubject}
          onOpenChange={() => setEditingSubject(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>
                Make changes to your subject here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 border-muted transition-all hover:scale-110 ${
                          editingSubject.color === color
                            ? "scale-110 ring-2 ring-primary ring-offset-2"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setEditingSubject({ ...editingSubject, color })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {icons.map((icon) => (
                      <Button
                        key={icon}
                        variant={
                          editingSubject.icon === icon ? "default" : "outline"
                        }
                        size="sm"
                        className="w-10 h-10 p-0 text-lg"
                        onClick={() =>
                          setEditingSubject({ ...editingSubject, icon })
                        }
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => editSubject(editingSubject)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
