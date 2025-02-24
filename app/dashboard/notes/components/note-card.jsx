"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const COLORS = [
  "bg-yellow-100",
  "bg-blue-100",
  "bg-pink-100",
  "bg-green-100",
  "bg-purple-100",
  "bg-orange-100"
]

export function NoteCard({ note, onDelete }) {
  return (
    <Card className={cn(
      "p-4 h-[200px] relative group transition-all hover:shadow-lg",
      note.color || COLORS[0]
    )}>
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
      </button>
      <h3 className="font-medium mb-2 text-gray-800">{note.title}</h3>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
    </Card>
  )
}
