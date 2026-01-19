import { Task, TaskState } from "@/types/task";
import { create } from "zustand";

const useTaskStore = create((set) => ({
  tasks: [
    {
      id: "1",
      title: "Project Proposal",
      category: "Work",
      time: "09:00 AM",
      completed: false,
      priority: "High",
    },
    {
      id: "2",
      title: "Gym Session",
      category: "Health",
      time: "05:00 PM",
      completed: true,
      priority: "Medium",
    },
  ],
  addTask: (task: Task) =>
    set((state: TaskState) => ({ tasks: [...state.tasks, task] })),
  toggleTask: (id: string) =>
    set((state: TaskState) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    })),
}));

export { useTaskStore };
