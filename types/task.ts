interface Task {
  id: string;
  title: string;
  category: string;
  time: string;
  completed: boolean;
  priority: "Low" | "Medium" | "High";
}

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
}

export { Task, TaskState };
