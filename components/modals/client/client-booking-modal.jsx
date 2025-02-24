"use client"

import { useState, useMemo, Fragment } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { listDocuments } from "@/lib/appwrite/server"
import { format, isBefore, startOfDay, addMinutes, addDays, parse } from "date-fns"
import { enUS } from "date-fns/locale"

const fetchBookings = async (selectedService, selectedDate) => {
  if (!selectedService) return { dayBookings: [], weekBookings: [] }

  const { documents: dayBookings } = await listDocuments("main_db", "bookings", [
    { type: "equal", name: "date", value: format(selectedDate, 'yyyy-MM-dd') },
    { type: "equal", name: "service_id", value: selectedService.$id }
  ])
  console.log(dayBookings, "dayBookingsdayBookingsdayBookingsdayBookingsdayBookings")
  return dayBookings;
}

export const BookingClientModal = ({
  isOpen,
  onClose,
  tracks,
  service,
  onSubmit
}) => {
  console.log('Service details:', {
    name: service.name,
    type: service.type,
    slotSteps: service.slotSteps,
    fullService: service
  });

  const [step, setStep] = useState(1) 
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlots, setSelectedSlots] = useState([])
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  

  const { data: bookingsData, error: bookingsError, isLoading: bookingsLoading } = useSWR(
    service ? ["bookings", service.$id, format(selectedDate, 'yyyy-MM-dd')] : null,
    () => fetchBookings(service, selectedDate),
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    }
  );
  console.log(bookingsData)

  console.log(service)
  // Generate time slots
  const timeSlots = useMemo(() => {
    if (!service) return []
    
    const slots = []
    const start = parse('08:00', 'HH:mm', new Date())
    const end = parse('22:00', 'HH:mm', new Date())
    let current = start

    while (isBefore(current, end)) {
      slots.push(format(current, 'HH:mm'))
      current = addMinutes(current, service.slotSteps)
    }

    return slots
  }, [service])

  const handleSlotClick = (time, trackId) => {
    if (selectedTrackId && selectedTrackId !== trackId) return;
    
    const slotIndex = selectedSlots.findIndex(
      slot => slot.time === time && slot.trackId === trackId
    );

    if (slotIndex > -1) {
      // Если слот уже выбран, удаляем его
      setSelectedSlots(prev => prev.filter((_, i) => i !== slotIndex));
      if (selectedSlots.length === 1) {
        setSelectedTrackId(null);
      }
    } else {
      // Если слот не выбран, добавляем его
      if (!selectedTrackId) {
        setSelectedTrackId(trackId);
      }
      setSelectedSlots(prev => [...prev, { time, trackId }]);
    }
  }

  const renderDateSelection = () => (
    <div className="flex flex-col items-center gap-6 py-6">
      {step === 1 && (
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          disabled={(date) => isBefore(date, startOfDay(new Date()))}
          className="rounded-md border"
        />
      )}

      {/* <Button
        className="w-full"
        onClick={() => setStep(2)}
        disabled={!selectedDate}
      >
        Continue
      </Button> */}
    </div>
  )

  const renderTimeGrid = () => {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Time</TableHead>
              {tracks.map((track) => (
                <TableHead key={track.$id} className="text-center">
                  {track.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((time) => (
              <TableRow key={time}>
                <TableCell className="font-medium">
                  {time}
                </TableCell>
                {tracks.map(track => {
                  const booking = bookingsData?.find(b => 
                    b.service_resources.$id === track.$id && 
                    b.start_time <= time && 
                    b.end_time > time
                  );

                  const isBooked = !!booking;
                  const isBlocked = booking?.type === 'block';
                  const isSelected = selectedSlots.some(slot => slot.time === time && slot.trackId === track.$id);
                  const isSelectedTrack = selectedTrackId === track.$id;
                  const isClickable = !isBooked && !isBlocked && (!selectedTrackId || selectedTrackId === track.$id);

                  return (
                    <TableCell 
                      key={track.$id}
                      className={cn(
                        "text-center p-0",
                        isClickable && "hover:bg-muted cursor-pointer"
                      )}
                      onClick={() => {
                        if (isClickable) {
                          handleSlotClick(time, track.$id);
                        }
                      }}
                    >
                      <div className={cn(
                        "rounded-md py-2 px-2 text-sm font-medium m-1",
                        {
                          "bg-emerald-50 hover:bg-emerald-100 text-emerald-700": isClickable && !isSelected,
                          "bg-emerald-100 text-emerald-700": isSelectedTrack && !isSelected && !isBooked && !isBlocked,
                          "bg-rose-50 text-rose-700": isBooked && !isBlocked,
                          "bg-slate-100 text-slate-500": isBlocked,
                          "bg-black text-white": isSelected,
                          "opacity-50": selectedTrackId && !isSelectedTrack && !isBooked && !isBlocked
                        }
                      )}>
                        {isBlocked ? "Maintenance" : isBooked ? "Booked" : "Available"}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderUserDetails = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={userDetails.name}
          onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={userDetails.email}
          onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={userDetails.phone}
          onChange={(e) => setUserDetails(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={userDetails.notes}
          onChange={(e) => setUserDetails(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      {/* <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button
          disabled={!userDetails.name || !userDetails.email || !userDetails.phone}
          onClick={() => {
            onSubmit({
              date: format(selectedDate, 'yyyy-MM-dd'),
              slots: selectedSlots,
              userDetails
            })
            onClose()
          }}
        >
          Book
        </Button>
      </div> */}
    </div>
  )

  const stepTitles = {
    1: "Select Date",
    2: "Select Time",
    3: "User Details"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("flex flex-col h-[80vh] overflow-x-auto", (step === 1 || step === 3) && "h-auto", step === 2 && "max-w-5xl")}>
        <DialogHeader className="px-6 py-4">
          <DialogTitle>
            {stepTitles[step]}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Please select a convenient date"}
            {step === 2 && "Please select a convenient time"}
            {step === 3 && "Please enter your details"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {step === 1 && (
            <div className="p-6">
              {renderDateSelection()}
            </div>
          )}
          {step === 2 && (
            <div className="px-6">
              {renderTimeGrid()}
            </div>
          )}
          {step === 3 && (
            <div className="p-6">
              {renderUserDetails()}
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4 mt-auto">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {step < 3 && (
              <Button
                onClick={() => {
                  if (step === 2 && selectedSlots.length === 0) {
                    return;
                  }
                  setStep(step + 1);
                }}
                disabled={step === 2 && selectedSlots.length === 0}
              >
                Continue
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={() => {
                  onSubmit({
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    slots: selectedSlots,
                    userDetails
                  })
                  onClose()
                }}
              >
                Book Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
