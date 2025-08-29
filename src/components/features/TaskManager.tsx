"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit3, Trash2, Calendar } from "lucide-react";

interface Task {
  id: number;
  title: string;
  subject: string;
  due: string;
  completed: boolean;
  description?: string;
}

interface Subject {
  id: number;
  name: string;
  color: string;
  icon: string;
  totalHours: number;
}

interface TaskManagerProps {
  tasks: Task[];
  updateTasks: (tasks: Task[]) => void;
  subjects: Subject[];
}

export const TaskManager = ({
  tasks = [],
  updateTasks,
  subjects = [
    { id: 1, name: "Mathematics", color: "blue", icon: "📐", totalHours: 0 },
    { id: 2, name: "Science", color: "green", icon: "🧪", totalHours: 0 },
    { id: 3, name: "English", color: "red", icon: "📚", totalHours: 0 },
    { id: 4, name: "History", color: "yellow", icon: "🏛️", totalHours: 0 },
    { id: 5, name: "General", color: "gray", icon: "📋", totalHours: 0 },
  ],
}: TaskManagerProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    due: "",
    description: "",
  });

  const addTask = () => {
    if (newTask.title.trim()) {
      const task: Task = {
        id: Date.now(),
        title: newTask.title,
        subject: newTask.subject || "General",
        due: newTask.due || "No due date",
        completed: false,
        description: newTask.description,
      };
      updateTasks([...tasks, task]);
      setNewTask({ title: "", subject: "", due: "", description: "" });
      setIsAddingTask(false);
    }
  };

  const toggleTask = (taskId: number) => {
    updateTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const editTask = (task: Task) => {
    updateTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    setEditingTask(null);
  };

  const deleteTask = (taskId: number) => {
    updateTasks(tasks.filter((task) => task.id !== taskId));
  };

  const completedTasks = tasks.filter((t) => t.completed).length;
  const remainingTasks = tasks.filter((t) => !t.completed).length;
  const progressPercentage = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">To-Do List</h2>
        <Button onClick={() => setIsAddingTask(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          {tasks.length === 0 ? (
            <Card className="bg-card text-card-foreground">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg mb-4">
                    No tasks yet
                  </p>
                  <Button onClick={() => setIsAddingTask(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.id}
                className="bg-card text-card-foreground hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-lg ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-4 mt-3">
                        <Badge variant="secondary">{task.subject}</Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {task.due}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Task Summary */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Tasks</span>
              <span className="font-bold">{tasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completed</span>
              <span className="font-bold text-primary">{completedTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Remaining</span>
              <span className="font-bold text-accent">{remainingTasks}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {progressPercentage}% Complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task to add to your to-do list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-subject">Subject</Label>
              <Select
                onValueChange={(value) =>
                  setNewTask({ ...newTask, subject: value })
                }
              >
                <SelectTrigger className="border border-border bg-background text-foreground rounded-md">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground rounded-md shadow-md">
                  {subjects.map((subject) => (
                    <SelectItem
                      key={subject.id}
                      value={subject.name}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                    >
                      {subject.icon} {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={newTask.due}
                onChange={(e) =>
                  setNewTask({ ...newTask, due: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (Optional)</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Enter task description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={addTask}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to your task here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-title">Task Title</Label>
                <Input
                  id="edit-task-title"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-subject">Subject</Label>
                <Select
                  value={editingTask.subject}
                  onValueChange={(value) =>
                    setEditingTask({ ...editingTask, subject: value })
                  }
                >
                  <SelectTrigger className="border border-border bg-background text-foreground rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground rounded-md shadow-md">
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.id}
                        value={subject.name}
                        className="px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                      >
                        {subject.icon} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-due">Due Date</Label>
                <Input
                  id="edit-task-due"
                  type="date"
                  value={editingTask.due}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, due: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="edit-task-description"
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => editTask(editingTask)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
