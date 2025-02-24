"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Circle, Timer, CheckCircle2, ChevronDown } from "lucide-react"
import { TodoCard } from "./components/todo-card"
import { CreateTodoModal } from "./components/create-todo-modal"
import { Query } from "appwrite"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Example data for testing
const exampleTodos = [
  {
    $id: "1",
    title: "Check Bowling Equipment",
    text: "Need to inspect all bowling lanes and perform maintenance",
    status: "todo",
    services: ["service1"],
    service_resources: ["bowling1", "bowling2"],
    date: "2025-02-20",
    users: ["John Smith"],
  },
  {
    $id: "2",
    title: "Clean Saunas",
    text: "Weekly cleaning of all saunas",
    status: "in_progress",
    services: ["service3"],
    service_resources: ["sauna1", "sauna2"],
    date: "2025-02-25",
    users: ["Maintenance Team"],
  },
  {
    $id: "3",
    title: "Update Pool Equipment",
    text: "Replace worn cues and chalk",
    status: "done",
    services: ["service2"],
    service_resources: ["pool1", "pool2"],
    date: "2025-02-18",
    done_date: "2025-02-18",
    done_time: "15:30:00",
    users: ["Admin"],
  },
  {
    $id: "4",
    title: "Order New Bowling Balls",
    text: "Need to order new bowling balls in various weights",
    status: "todo",
    services: ["service1"],
    service_resources: ["bowling1", "bowling2"],
    date: "2025-02-22",
    users: ["Admin"],
  },
  {
    $id: "5",
    title: "Fix Pool Table Lighting",
    text: "Replace broken lights above pool tables",
    status: "in_progress",
    services: ["service2"],
    service_resources: ["pool1"],
    date: "2025-02-21",
    users: ["Maintenance Team"],
  },
  {
    $id: "6",
    title: "Sauna Temperature Check",
    text: "Verify and calibrate temperature controls in all saunas",
    status: "todo",
    services: ["service3"],
    service_resources: ["sauna1", "sauna2"],
    date: "2025-02-23",
    users: ["John Smith"],
  },
  {
    $id: "7",
    title: "Monthly Bowling Lane Waxing",
    text: "Perform regular maintenance waxing of all bowling lanes",
    status: "in_progress",
    services: ["service1"],
    service_resources: ["bowling1", "bowling2"],
    date: "2025-02-24",
    users: ["Maintenance Team"],
  },
  {
    $id: "8",
    title: "Pool Tournament Setup",
    text: "Prepare tables and equipment for weekend tournament",
    status: "done",
    services: ["service2"],
    service_resources: ["pool1", "pool2"],
    date: "2025-02-17",
    done_date: "2025-02-17",
    done_time: "18:45:00",
    users: ["Admin"],
  },
  {
    $id: "9",
    title: "Sauna Ventilation Service",
    text: "Annual maintenance of ventilation systems in saunas",
    status: "done",
    services: ["service3"],
    service_resources: ["sauna1", "sauna2"],
    date: "2025-02-16",
    done_date: "2025-02-16",
    done_time: "14:20:00",
    users: ["Maintenance Team"],
  }
]

const exampleServices = [
  {
    $id: "service1",
    name: "Bowling",
  },
  {
    $id: "service2",
    name: "Pool Table",
  },
  {
    $id: "service3",
    name: "Sauna",
  },
]

const exampleResources = [
  {
    $id: "bowling1",
    name: "Bowling Track #1",
  },
  {
    $id: "bowling2",
    name: "Bowling Track #2",
  },
  {
    $id: "pool1",
    name: "Pool Table #1",
  },
  {
    $id: "pool2",
    name: "Pool Table #2",
  },
  {
    $id: "sauna1",
    name: "Sauna #1",
  },
  {
    $id: "sauna2",
    name: "Sauna #2",
  },
]

// Constants for database
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID
const TODOS_COLLECTION_ID = "todos" // Replace with your collection ID

export default function TodoPage() {
  const [todos, setTodos] = useState(exampleTodos)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [services, setServices] = useState(exampleServices)
  const [resources, setResources] = useState(exampleResources)
  const [collapsedSections, setCollapsedSections] = useState({
    todo: false,
    in_progress: false,
    done: false,
  })

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Fetch todos
  const fetchTodos = async () => {
    // В будущем здесь будет реальный API-запрос
    // Пока используем тестовые данные
    setTodos(exampleTodos)
  }

  // Fetch services and resources
  const fetchServicesAndResources = async () => {
    // В будущем здесь будет реальный API-запрос
    // Пока используем тестовые данные
    setServices(exampleServices)
    setResources(exampleResources)
  }

  useEffect(() => {
    fetchTodos()
    fetchServicesAndResources()
  }, [])

  const handleStatusChange = async (todoId, newStatus) => {
    try {
      const now = new Date()
      const updateData = {
        status: newStatus,
      }

      if (newStatus === "done") {
        updateData.done_date = now.toISOString().split("T")[0]
        updateData.done_time = now.toTimeString().split(" ")[0]
      }

      // В будущем здесь будет реальный API-запрос
      // Пока обновляем локально
      setTodos(todos.map(todo => {
        if (todo.$id === todoId) {
          return { ...todo, ...updateData }
        }
        return todo
      }))

      toast({
        title: "Success",
        description: "Todo status updated successfully",
      })
    } catch (error) {
      console.error("Error updating todo status:", error)
      toast({
        title: "Error",
        description: "Failed to update todo status",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-[80%] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold">Todo List</h1>
            <p className="text-sm text-gray-500">Manage your tasks and maintenance</p>
          </div>
        </div>

        {/* Todo sections */}
        <div className="space-y-4">
          {/* Todo Section */}
          <div>
            <button 
              onClick={() => toggleSection('todo')}
              className="flex items-center gap-2 text-yellow-700 font-medium w-full hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
            >
              <Circle className="w-4 h-4" />
              <h2 className="text-sm">Todo</h2>
              <span className="text-gray-400 text-xs">
                ({todos.filter(t => t.status === "todo").length})
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 ml-auto transition-transform",
                collapsedSections.todo ? "rotate-180" : ""
              )} />
            </button>
            <div className={cn(
              "grid grid-cols-2 gap-2 mt-2 transition-all",
              collapsedSections.todo ? "hidden" : ""
            )}>
              {todos
                .filter(todo => todo.status === "todo")
                .map((todo) => (
                  <TodoCard
                    key={todo.$id}
                    todo={todo}
                    services={services}
                    resources={resources}
                    onStatusChange={handleStatusChange}
                  />
                ))}
            </div>
          </div>

          {/* In Progress Section */}
          <div>
            <button 
              onClick={() => toggleSection('in_progress')}
              className="flex items-center gap-2 text-blue-700 font-medium w-full hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
            >
              <Timer className="w-4 h-4" />
              <h2 className="text-sm">In Progress</h2>
              <span className="text-gray-400 text-xs">
                ({todos.filter(t => t.status === "in_progress").length})
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 ml-auto transition-transform",
                collapsedSections.in_progress ? "rotate-180" : ""
              )} />
            </button>
            <div className={cn(
              "grid grid-cols-2 gap-2 mt-2 transition-all",
              collapsedSections.in_progress ? "hidden" : ""
            )}>
              {todos
                .filter(todo => todo.status === "in_progress")
                .map((todo) => (
                  <TodoCard
                    key={todo.$id}
                    todo={todo}
                    services={services}
                    resources={resources}
                    onStatusChange={handleStatusChange}
                  />
                ))}
            </div>
          </div>

          {/* Done Section */}
          <div>
            <button 
              onClick={() => toggleSection('done')}
              className="flex items-center gap-2 text-green-700 font-medium w-full hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <h2 className="text-sm">Done</h2>
              <span className="text-gray-400 text-xs">
                ({todos.filter(t => t.status === "done").length})
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 ml-auto transition-transform",
                collapsedSections.done ? "rotate-180" : ""
              )} />
            </button>
            <div className={cn(
              "grid grid-cols-2 gap-2 mt-2 transition-all",
              collapsedSections.done ? "hidden" : ""
            )}>
              {todos
                .filter(todo => todo.status === "done")
                .map((todo) => (
                  <TodoCard
                    key={todo.$id}
                    todo={todo}
                    services={services}
                    resources={resources}
                    onStatusChange={handleStatusChange}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      <CreateTodoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        services={services}
        resources={resources}
        onSuccess={() => {
          fetchTodos()
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
