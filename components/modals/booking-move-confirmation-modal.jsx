import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export function BookingMoveConfirmationModal({
  isOpen,
  onClose,
  booking,
  newDate,
  newTime,
  newResource,
  onConfirm
}) {
  if (!booking) return null

  // Calculate new end time based on booking duration
  const startMinutes = parseInt(newTime.split(':')[0]) * 60 + parseInt(newTime.split(':')[1])
  const duration = parseInt(booking.end_time.split(':')[0]) * 60 + parseInt(booking.end_time.split(':')[1]) - 
                  (parseInt(booking.start_time.split(':')[0]) * 60 + parseInt(booking.start_time.split(':')[1]))
  const totalEndMinutes = startMinutes + duration
  const endHours = Math.floor(totalEndMinutes / 60)
  const endMinutes = totalEndMinutes % 60
  const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Booking Move</DialogTitle>
          <DialogDescription>
            Are you sure you want to move this booking?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Current Booking:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Date: {format(new Date(booking.date), 'dd.MM.yyyy')}</p>
                <p>Time: {booking.start_time} - {booking.end_time}</p>
                <p>Resource: {booking.service_resources.name}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">New Location:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Date: {format(newDate, 'dd.MM.yyyy')}</p>
                <p>Time: {newTime} - {newEndTime}</p>
                <p>Resource: {newResource.name}</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
