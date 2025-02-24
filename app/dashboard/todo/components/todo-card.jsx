import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Clock, User, CheckCircle2, Circle, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

export function TodoCard({ todo, services, resources, onStatusChange }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "todo":
        return {
          color: "border-yellow-500",
          textColor: "text-yellow-700",
          icon: Circle,
          label: "Todo"
        }
      case "in_progress":
        return {
          color: "border-blue-500",
          textColor: "text-blue-700",
          icon: Timer,
          label: "In Progress"
        }
      case "done":
        return {
          color: "border-green-500",
          textColor: "text-green-700",
          icon: CheckCircle2,
          label: "Done"
        }
      default:
        return {
          color: "border-gray-300",
          textColor: "text-gray-700",
          icon: Circle,
          label: "Unknown"
        }
    }
  }

  const statusConfig = getStatusConfig(todo.status)
  const StatusIcon = statusConfig.icon

  return (
    <Card className={cn(
      "w-full transition-all hover:shadow-md border-l-4",
      statusConfig.color
    )}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("w-4 h-4", statusConfig.textColor)} />
            <h3 className="font-medium">{todo.title}</h3>
          </div>
          <Select
            value={todo.status}
            onValueChange={(value) => onStatusChange(todo.$id, value)}
          >
            <SelectTrigger className="w-[120px] h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0 px-4">
        <p className="text-sm text-gray-600 mb-2">{todo.text}</p>
        <div className="flex flex-wrap gap-1.5">
          {todo.services?.map((serviceId) => {
            const service = services.find((s) => s.$id === serviceId)
            return service ? (
              <Badge key={service.$id} variant="secondary" className="text-xs">
                {service.name}
              </Badge>
            ) : null
          })}
          {todo.service_resources?.map((resourceId) => {
            const resource = resources.find((r) => r.$id === resourceId)
            return resource ? (
              <Badge key={resource.$id} variant="outline" className="text-xs">
                {resource.name}
              </Badge>
            ) : null
          })}
        </div>
        {/* Date and Time Info */}
        <div className="text-sm space-y-1 border-t pt-2 mt-2 border-dashed">
          {todo.date && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
              <span>Due: {todo.date}</span>
            </div>
          )}
          {todo.status === "done" && (
            <>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>Completed: {todo.done_date}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>At: {todo.done_time}</span>
              </div>
            </>
          )}
        </div>

        {/* Users */}
        {todo.users && todo.users.length > 0 && (
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <User className="w-4 h-4 mr-1.5 text-gray-500" />
            <span>Assigned to: {todo.users.join(", ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
