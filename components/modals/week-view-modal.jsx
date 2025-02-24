import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export const WeekViewModal = ({
  isOpen,
  onClose,
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Weekly Schedule</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

  