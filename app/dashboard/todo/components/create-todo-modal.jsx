import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { toast } from "@/hooks/use-toast"

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID
const TODOS_COLLECTION_ID = "todos" // Replace with your collection ID

export function CreateTodoModal({ isOpen, onClose, services, resources, onSuccess }) {
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedResources, setSelectedResources] = useState([])
  const [date, setDate] = useState("")


  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title || !text) {
      toast({
        title: "Error",
        description: "Title and text are required",
        variant: "destructive",
      })
      return
    }

    try {
      await databases.createDocument(DATABASE_ID, TODOS_COLLECTION_ID, "unique()", {
        title,
        text,
        status: "todo",
        services: selectedServices,
        service_resources: selectedResources,
        date,
      })

      toast({
        title: "Success",
        description: "Todo created successfully",
      })

      // Reset form
      setTitle("")
      setText("")
      setSelectedServices([])
      setSelectedResources([])
      setDate("")

      onSuccess()
    } catch (error) {
      console.error("Error creating todo:", error)
      toast({
        title: "Error",
        description: "Failed to create todo",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="text" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter todo description"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Services</label>
            <MultiSelect
              options={services.map((service) => ({
                label: service.name,
                value: service.$id,
              }))}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select services..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resources</label>
            <MultiSelect
              options={resources.map((resource) => ({
                label: resource.name,
                value: resource.$id,
              }))}
              selected={selectedResources}
              onChange={setSelectedResources}
              placeholder="Select resources..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Todo</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
