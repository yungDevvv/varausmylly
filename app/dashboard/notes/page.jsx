"use client"

import { useState } from "react"
import { NoteCard } from "./components/note-card"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Example data
const exampleNotes = [
  {
    id: "1",
    title: "Social Media",
    content: "- Plan social content\n- Build content calendar\n- Plan promotion and distribution",
    color: "bg-yellow-100"
  },
  {
    id: "2",
    title: "Content Strategy",
    content: "Would need some time to see (publish goals, personas, budget, audits), but after, it would be good to focus on assembling my team (start with SEO specialist then perhaps an email marketer?). Also need to brainstorm on tooling.",
    color: "bg-blue-100"
  },
  {
    id: "3",
    title: "Email A/B Tests",
    content: "- Subject lines\n- Sender\n- CTA\n- Sending times",
    color: "bg-pink-100"
  },
  {
    id: "4",
    title: "Banner Ads",
    content: "Notes from the workshop:\n- Brand metrics\n- Choose distinctive imagery\n- The landing page must match the display ad",
    color: "bg-orange-100"
  }
]

export default function NotesPage() {
  const [notes, setNotes] = useState(exampleNotes)
  const [isOpen, setIsOpen] = useState(false)
  const [newNote, setNewNote] = useState({ title: "", content: "" })

  const handleDelete = (id) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const handleCreate = () => {
    if (newNote.title.trim() === "") return

    const colors = ["bg-yellow-100", "bg-blue-100", "bg-pink-100", "bg-green-100", "bg-purple-100", "bg-orange-100"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    setNotes([
      ...notes,
      {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        color: randomColor
      }
    ])
    setNewNote({ title: "", content: "" })
    setIsOpen(false)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-[90%] mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Sticky Wall</h1>
          <p className="text-sm text-gray-500">Organize your thoughts and ideas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
            />
          ))}
          
          {/* Add Note Button */}
          <Card 
            className="h-[200px] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border-2 border-dashed"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-8 w-8 text-gray-400" />
          </Card>
        </div>
      </div>

      {/* Create Note Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Note Title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <Textarea
              placeholder="Note Content"
              className="min-h-[150px]"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            />
            <Button onClick={handleCreate} className="w-full">
              Create Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
