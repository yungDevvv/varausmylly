"use client"

import { useState, useMemo, useEffect } from "react"
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDraggable,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useModal } from "@/hooks/use-modal"
import { format, isBefore, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { enUS, fi } from "date-fns/locale"
import { AlertTriangle, Calendar as CalendarIcon, Info } from "lucide-react"
import { BookingMoveConfirmationModal } from "@/components/modals/booking-move-confirmation-modal"
import { listDocuments, updateDocument } from "@/lib/appwrite/server"
import { cn } from "@/lib/utils"
import { WeekViewModal } from "@/components/modals/week-view-modal"
import "./schedule.css"
import { toast } from "@/hooks/use-toast"
import useSWR from "swr"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}


const BookingBlock = ({ booking, time, isDragging, dragHandlers }) => {
  const { onOpen } = useModal()
  const t = useTranslations()
  const startMinutes = timeToMinutes(booking.start_time)
  const endMinutes = timeToMinutes(booking.end_time)
  const duration = Math.ceil((endMinutes - startMinutes) / 60)
  const currentMinutes = timeToMinutes(time)

  const isWithinBooking = currentMinutes >= startMinutes && currentMinutes < endMinutes
  const isFirstSlot = time === booking.start_time

  if (!isWithinBooking) return null

  if (!isFirstSlot) {
    return <div className="h-[34px]" />
  }

  return (
    <div
      {...dragHandlers}
      className="h-[34px] relative cursor-grab active:cursor-grabbing pointer-events-none"
      style={{
        pointerEvents: isFirstSlot ? 'all' : 'none'
      }}
    >
      <div
        className={cn(
          "absolute border-l-4 inset-0 rounded-md overflow-hidden transition-colors pointer-events-none flex flex-col justify-end",
          booking.type === "block"
            ? "border-gray-600 bg-gray-500/90 hover:bg-gray-500"
            : "border-green-600 bg-green-300 hover:bg-green-400 hover:!text-green-400"
        )}
        style={{
          height: `${duration * 42}px`,
          zIndex: booking.type === "block" ? 5 : 10
        }}
      >
        <div className="px-1 pointer-events-none mb-1">
          <div className={cn(
            "text-xs truncate max-w-[120px] mb-0.5",
            booking.type === "block" && "text-white"
          )}>
            {booking?.name ? booking.name : 'error'}
          </div>
          <div className={cn(
            "text-xs truncate max-w-[120px]",
            booking.type === "block" && "text-gray-200"
          )}>
            {booking?.email ? booking.email : t("bookingError")}
          </div>
          <button
            className={cn(
              "absolute top-1 right-1 p-1 rounded-full transition-colors pointer-events-auto",
              booking.type === "block"
                ? "hover:bg-gray-400/20 text-white"
                : "hover:bg-white/20 text-black"
            )}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Opening modal with booking data:", booking);
              onOpen("admin-booking", { booking, edit: true });
            }}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isDragging && (
        <div
          className={cn(
            "fixed rounded-lg shadow-lg pointer-events-none p-3 font-medium",
            booking.type === "block"
              ? "bg-gray-500 text-white"
              : "bg-green-500 text-white"
          )}
          style={{
            width: "200px",
            height: "auto",
            left: 0,
            top: 0,
            transform: `translate(${dragHandlers.style?.transform})`,
            opacity: 0.9,
            zIndex: 1000
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="text-sm">{booking.name}</div>
            <div className={cn(
              "text-xs opacity-75",
              booking.type === "block" && "text-gray-200"
            )}>{booking.start_time} - {booking.end_time}</div>
          </div>
        </div>
      )}
    </div>
  )
}

const DraggableCell = ({ booking, time, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${booking?.$id}-${booking?.service_resources.$id}-${time}`,
    data: {
      booking,
      time
    }
  });

  if (!booking) return children;

  const startMinutes = timeToMinutes(booking.start_time)
  const endMinutes = timeToMinutes(booking.end_time)
  const currentMinutes = timeToMinutes(time)
  const isWithinBooking = currentMinutes >= startMinutes && currentMinutes < endMinutes

  if (!isWithinBooking) return children;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div className="relative">
      <BookingBlock
        booking={booking}
        time={time}
        isDragging={isDragging}
        dragHandlers={{
          ref: setNodeRef,
          ...listeners,
          ...attributes,
          style
        }}
      />
    </div>
  );
};

const DroppableCell = ({ time, date, resourceId, children, status }) => {
  const { setNodeRef, isOver: cellIsOver } = useDroppable({
    id: `${format(date, 'yyyy-MM-dd')}-${time}-${resourceId}`,
    data: {
      time,
      date,
      resourceId
    },
    disabled: status !== 'available'
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full transition-all duration-200 pointer-events-auto relative",
        cellIsOver && status === 'available' && "bg-green-100 scale-105 ring-2 z-50 rounded-sm ring-offset-4 !border-none ring-green-500",
        cellIsOver && status !== 'available' && "bg-red-100 scale-105 ring-2 ring-red-500"
      )}
    >
      {children}
    </div>
  );
};

export function ScheduleTab({
  workingHours,
  specialHours,
  selectedService
}) {
  const t = useTranslations()
  const fetcher = async () => {
    if (!selectedService) return []
    const { documents } = await listDocuments("main_db", "service_resources", [
      { type: "equal", name: "services", value: selectedService.$id }
    ])
    return documents
  }

  const fetchBookings = async () => {
    if (!selectedService) return { dayBookings: [], weekBookings: [] }
    
    const { documents: dayBookings } = await listDocuments("main_db", "bookings", [
      { type: "equal", name: "date", value: format(selectedDate, 'yyyy-MM-dd') },
      { type: "equal", name: "service_id", value: selectedService.$id }
    ])

    const { documents: weeklyBookings } = await listDocuments("main_db", "bookings", [
      { type: "equal", name: "service_id", value: selectedService.$id }
    ])

    return { dayBookings, weekBookings: weeklyBookings }
  }

 


  const [draggedBooking, setDraggedBooking] = useState(null)
  const [draggedElement, setDraggedElement] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState('day') // 'day' or 'week'
  const [isWeekViewOpen, setIsWeekViewOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false)
  const [moveConfirmation, setMoveConfirmation] = useState({
    isOpen: false,
    booking: null,
    newDate: null,
    newTime: null,
    newResource: null
  })

  const { onOpen } = useModal()

  const { data: serviceResources, error: resourcesError, isLoading: resourcesLoading } = useSWR(
    selectedService ? ["service_resources", selectedService.$id] : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    }
  );

  const { data: bookingsData, error: bookingsError, isLoading: bookingsLoading } = useSWR(
    selectedService ? ["bookings", selectedService.$id, format(selectedDate, 'yyyy-MM-dd')] : null,
    fetchBookings,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    }
  );

  const dayBookings = bookingsData?.dayBookings || [];
  const weekBookings = bookingsData?.weekBookings || [];

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const getDaySchedule = (date) => {
    // In JavaScript, Sunday = 0, Monday = 1, etc.
    // We need: Monday = 0, Tuesday = 1, ..., Sunday = 6
    const dayIndex = (date.getDay() + 6) % 7
    const dateStr = format(date, 'yyyy-MM-dd')

    // Check for special hours first
    const specialDay = specialHours?.find(sh => sh.date === dateStr)
    if (specialDay) {
      return {
        ...workingHours[dayIndex],
        start_time: specialDay.start_time,
        end_time: specialDay.end_time,
        isSpecial: true,
        specialReason: specialDay.reason
      }
    }

    // Return regular working hours
    return workingHours[dayIndex]
  }

  // Time slots for the schedule
  const timeSlots = useMemo(() => {
    if (!selectedService || !workingHours) return []

    // Get working hours for the day
    const schedule = getDaySchedule(selectedDate)

    if (!schedule || !schedule.isWorkingDay) return []

    const slots = []
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number)
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number)
    const slotStepsMinutes = selectedService.slotSteps // Already in minutes

    // Calculate total minutes for start and end
    let currentTimeInMinutes = startHour * 60 + startMinute
    const endTimeInMinutes = endHour * 60 + endMinute

    while (currentTimeInMinutes < endTimeInMinutes) {
      const hours = Math.floor(currentTimeInMinutes / 60)
      const minutes = currentTimeInMinutes % 60
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
      currentTimeInMinutes += slotStepsMinutes
    }

    return slots
  }, [selectedService, workingHours, selectedDate])

  const getBookingsForDate = (date, bookings) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookings.filter(booking => booking.date === dateStr)
  }

  const getTimeSlotStatus = (date, time, resourceId) => {
    if (!time) return;

    // Get working hours for the day
    const schedule = getDaySchedule(date)

    if (!schedule?.isWorkingDay) {
      return { status: 'closed', reason: t("scheduleNotWorkingDay") }
    }

    // Check if the time slot is within break times
    const timeInMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])

    // Parse breaks array and check if current time is within any break
    if (schedule.breaks) {
      const breaks = schedule.breaks
      const isBreakTime = breaks.some(breakTime => {
        const breakStart = parseInt(breakTime.start.split(':')[0]) * 60 + parseInt(breakTime.start.split(':')[1])
        const breakEnd = parseInt(breakTime.end.split(':')[0]) * 60 + parseInt(breakTime.end.split(':')[1])
        return timeInMinutes >= breakStart && timeInMinutes < breakEnd
      })

      if (isBreakTime) {
        return { status: 'break' }
      }
    }

    // Check if the slot is booked
    const dateBookings = isWeekViewOpen ? getBookingsForDate(date, weekBookings) : dayBookings
    const booking = dateBookings.find(booking => {
      const bookingStartTime = parseInt(booking.start_time.split(':')[0]) * 60 + parseInt(booking.start_time.split(':')[1])
      const bookingEndTime = parseInt(booking.end_time.split(':')[0]) * 60 + parseInt(booking.end_time.split(':')[1])
      return booking.service_resources.$id === resourceId &&
        timeInMinutes >= bookingStartTime &&
        timeInMinutes < bookingEndTime
    })

    if (booking) {
      return {
        status: 'booked',
        reason: "" //`${booking.name}`
      }
    }

    return { status: 'available' }
  }

  const getBookingTimeSlots = (booking) => {
    const startTime = parseInt(booking.start_time.split(':')[0]) * 60 + parseInt(booking.start_time.split(':')[1])
    const endTime = parseInt(booking.end_time.split(':')[0]) * 60 + parseInt(booking.end_time.split(':')[1])
    const slots = []

    for (let time = startTime; time < endTime; time += selectedService.slotSteps) {
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }

    return slots
  }

  const handleTimeSlotClick = (date, time, status, resource) => {
    if (status === 'available') {
      onOpen("admin-booking", { selectedDate: date, start_time: time, resource })
    } else if (status === 'booked') {
      // Find the booking for this slot
      const dateBookings = isWeekViewOpen ? getBookingsForDate(date, weekBookings) : dayBookings
      const booking = dateBookings.find(booking => {
        const timeInMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
        const bookingStartTime = parseInt(booking.start_time.split(':')[0]) * 60 + parseInt(booking.start_time.split(':')[1])
        const bookingEndTime = parseInt(booking.end_time.split(':')[0]) * 60 + parseInt(booking.end_time.split(':')[1])
        return booking.service_resources.$id === resource.$id &&
          timeInMinutes >= bookingStartTime &&
          timeInMinutes < bookingEndTime
      })

      if (booking) {
        setSelectedBooking(booking)
        setIsBookingDetailsOpen(true)
      }
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)

    const { booking, time } = active.data.current
    if (booking) {
      document.body.classList.add('dragging-booking')
      setDraggedBooking({
        ...booking,
        timeSlots: getBookingTimeSlots(booking)
      })

      setDraggedElement(true)
    }
  }

  const handleDragEnd = async (event) => {
    setActiveId(null)
    setDraggedElement(null)

    if (!draggedBooking) return

    document.body.classList.remove('dragging-booking')

    const { over } = event
    if (!over) {
      setDraggedBooking(null)
      return
    }

    const { time: newStartTime, date: newDate, resourceId: newResourceId } = over.data.current || {}

    // If no valid drop target, cancel the drag
    if (!newStartTime || !newDate || !newResourceId) {
      setDraggedBooking(null)
      return
    }

    const newResource = serviceResources.find(r => r.$id === newResourceId)
    if (!newResource) {
      setDraggedBooking(null)
      return
    }

    // Calculate new end time
    const duration = timeToMinutes(draggedBooking.end_time) - timeToMinutes(draggedBooking.start_time)
    const newEndTimeMinutes = timeToMinutes(newStartTime) + duration
    const newEndTime = minutesToTime(newEndTimeMinutes)

    // Get schedule for this day
    const schedule = getDaySchedule(newDate)
    const serviceEndTimeMinutes = timeToMinutes(schedule.end_time)

    // Check if booking extends beyond service working hours
    if (newEndTimeMinutes > serviceEndTimeMinutes) {
      toast({
        title: t("scheduleOutsideHoursTitle"),
        description: (
          <div className="mt-2 flex flex-col space-y-2">
            <p>{t("scheduleOutsideHoursDescription")}</p>
            <p className="text-sm text-muted-foreground">
              {t("scheduleServiceClosesAt")}: {schedule.end_time}
              <br />
              {t("scheduleBookingWouldEndAt")}: {newEndTime}
            </p>
          </div>
        ),
        variant: "destructive",
        duration: 5000,
      })
      setDraggedBooking(null)
      return
    }

    // Check for conflicts with existing bookings
    const conflictingBookings = dayBookings.filter(booking => {
      if (booking.$id === draggedBooking.$id) return false // Exclude current booking
      if (booking.service_resources.$id !== newResourceId) return false // Check only bookings for target resource

      const bookingStart = timeToMinutes(booking.start_time)
      const bookingEnd = timeToMinutes(booking.end_time)
      const newStart = timeToMinutes(newStartTime)
      const newEnd = timeToMinutes(newEndTime)

      // Check for time overlap
      return (newStart < bookingEnd && newEnd > bookingStart)
    })

    if (conflictingBookings.length > 0) {
      const conflictingBooking = conflictingBookings[0]
      toast({
        title: t("scheduleConflictTitle"),
        description: (
          <div className="mt-2 flex flex-col space-y-2">
            <p>{t("scheduleConflictDescription", { start: newStartTime, end: newEndTime })}</p>
            <p className="text-sm text-muted-foreground">
              {t("scheduleConflictingBooking")}: {conflictingBooking.name}
              <br />
              {t("scheduleTime")}: {conflictingBooking.start_time} - {conflictingBooking.end_time}
            </p>
          </div>
        ),
        variant: "destructive",
        duration: 5000,
      })
      setDraggedBooking(null)
      return
    }

    setMoveConfirmation({
      isOpen: true,
      booking: draggedBooking,
      newDate: format(newDate, 'yyyy-MM-dd'),
      newTime: newStartTime,
      newEndTime,
      newResource
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDraggedElement(null)
    setDraggedBooking(null)
    document.body.classList.remove('dragging-booking')
  }


  const handleEditBooking = (booking) => {
    onOpen("admin-booking", {
      booking,
      selectedDate,
      resources: serviceResources
    })
  }

  const handleBlockResources = () => {
    onOpen("block-resource", {
      date: selectedDate,
      service: selectedService,
      resources: serviceResources
    })
  }

  const { mutate } = useSWRConfig();

  const handleMoveConfirm = async () => {
    const { booking, newDate, newTime, newEndTime, newResource } = moveConfirmation;

    try {
      await updateDocument("main_db", "bookings", booking.$id, {
        date: newDate,
        start_time: newTime,
        end_time: newEndTime,
        service_resources: newResource.$id
      })

      // Обновляем все связанные данные
      await Promise.all([
        mutate(["service_resources", selectedService.$id]),
        mutate(["bookings", selectedService.$id, format(selectedDate, 'yyyy-MM-dd')])
      ]);

      toast({
        title: t("scheduleBookingTitle"),
        description: t("scheduleBookingMoved"),
        variant: "success",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t("scheduleErrorTitle"),
        description: t("scheduleErrorMoving"),
        variant: "internalerror",
      })
    }

    // Reset all drag-related states
    setMoveConfirmation({
      isOpen: false,
      booking: null,
      newDate: null,
      newTime: null,
      newEndTime: null,
      newResource: null
    });
    setDraggedBooking(null);
    setDraggedElement(null);
    setActiveId(null);
  }

  const renderTimeSlot = (time, resource) => {
    const { status, reason } = getTimeSlotStatus(selectedDate, time, resource.$id);
    const isPartOfDraggedBooking = draggedBooking?.timeSlots.includes(time) &&
      draggedBooking?.service_resources.$id === resource.$id;

    return (
      <Button
        key={`${resource.$id}-${time}`}
        variant="secondary"
        className={cn(
          "w-full justify-center py-2",
          {
            "opacity-50 cursor-not-allowed": status === "unavailable" && !isPartOfDraggedBooking,
            "bg-green-300 hover:bg-green-400": status === "booked" && !isPartOfDraggedBooking,
            "bg-gray-500 text-white hover:bg-gray-600": status === "blocked" && !isPartOfDraggedBooking
          }
        )}
        onClick={() => handleTimeSlotClick(time, resource)}
      >
        {status === "available" ? t("scheduleStatusAvailable") : reason}
      </Button>
    );
  };

  const renderDayView = () => {
    const schedule = getDaySchedule(selectedDate)

    if (!schedule?.isWorkingDay) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t("scheduleTime")}</TableHead>
              {serviceResources && serviceResources.map((resource) => (
                <TableHead key={resource.$id} className="text-center">
                  {resource.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="relative">
            <TableRow>
              <TableCell className="font-medium invisible">{t("scheduleInvisible")}</TableCell>
              <TableCell>
                <div className="absolute text-muted-foreground inset-0 top-5 flex items-center justify-center">
                  {t("scheduleNotWorkingDay")}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Table className="">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">{t("scheduleTime")}</TableHead>
              {serviceResources && serviceResources.map((resource) => (
                <TableHead key={resource.$id} className="text-center">
                  {resource.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((time, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{time}</TableCell>
                {serviceResources && serviceResources.map((resource) => {
                  const { status, reason } = getTimeSlotStatus(selectedDate, time, resource.$id)
                  const isPartOfDraggedBooking = draggedBooking?.timeSlots.includes(time) &&
                    draggedBooking?.service_resources.$id === resource.$id

                  const cellContent = (
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        variant={
                          status === 'booked' ? (
                            (() => {
                              const booking = dayBookings.find(b => {
                                const bookingStartMinutes = timeToMinutes(b.start_time)
                                const bookingEndMinutes = timeToMinutes(b.end_time)
                                const slotMinutes = timeToMinutes(time)
                                return b.service_resources.$id === resource.$id &&
                                  slotMinutes >= bookingStartMinutes &&
                                  slotMinutes < bookingEndMinutes
                              })
                              return booking?.type === 'block' ? 'destructive' : 'success'
                            })()
                          ) :
                            status === 'available' ? 'secondary' :
                              status === 'break' ? 'warning' :
                                'destructive'
                        }
                        className={cn(
                          "w-full justify-center py-2",
                          isPartOfDraggedBooking && "opacity-50"
                        )}
                      >
                        {status === 'available' ? t("scheduleStatusAvailable") :
                          status === 'break' ? t("scheduleStatusBreak") :
                            status === 'booked' ? (
                              (() => {
                                const booking = dayBookings.find(booking => {
                                  const bookingStartMinutes = timeToMinutes(booking.start_time)
                                  const bookingEndMinutes = timeToMinutes(booking.end_time)
                                  const slotMinutes = timeToMinutes(time)
                                  return booking.service_resources.$id === resource.$id &&
                                    slotMinutes >= bookingStartMinutes &&
                                    slotMinutes < bookingEndMinutes
                                })
                                return booking?.type === 'block' ? t("scheduleStatusBlocked") : t("scheduleStatusBooked")
                              })()
                            ) :
                              t("scheduleStatusClosed")}
                      </Badge>
                      {reason && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {reason}
                        </span>
                      )}
                    </div>
                  )

                  return (
                    <TableCell
                      key={resource.$id}
                      className={cn(
                        "!max-w-[120px] relative px-1 py-2",
                        !isPartOfDraggedBooking && " ",
                        status === "available" && "hover:outline hover:outline-1 hover:-outline-offset-1 cursor-pointer hover:outline-black"
                      )}
                      onClick={() => {
                        if (!isPartOfDraggedBooking) {
                          handleTimeSlotClick(selectedDate, time, status, resource)
                        }
                      }}
                    >
                      <DroppableCell
                        time={time}
                        date={selectedDate}
                        resourceId={resource.$id}
                        status={status}
                      >
                        {status === 'booked' && !isPartOfDraggedBooking ? (
                          (() => {
                            const bookingsForThisSlot = dayBookings.filter(b => {
                              const bookingStartMinutes = timeToMinutes(b.start_time)
                              const bookingEndMinutes = timeToMinutes(b.end_time)
                              const slotMinutes = timeToMinutes(time)
                              return b.service_resources.$id === resource.$id &&
                                slotMinutes >= bookingStartMinutes &&
                                slotMinutes < bookingEndMinutes
                            })

                            if (bookingsForThisSlot.length === 0) return cellContent

                            // Sort bookings by type - regular bookings first, blocks last
                            bookingsForThisSlot.sort((a, b) => {
                              if (a.type === "block" && b.type !== "block") return 1
                              if (a.type !== "block" && b.type === "block") return -1
                              return 0
                            })

                            // Take the first booking for display
                            const currentBooking = bookingsForThisSlot[0]

                            return (
                              <DraggableCell
                                booking={currentBooking}
                                time={time}
                                onSelect={handleEditBooking}
                              >
                                {cellContent}
                              </DraggableCell>
                            )
                          })()
                        ) : (
                          cellContent
                        )}
                      </DroppableCell>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DragOverlay>
          {draggedElement && draggedBooking ? (
            <div
              className={cn(
                "fixed rounded-lg shadow-lg pointer-events-none p-3 font-medium",
                draggedBooking.type === "block"
                  ? "bg-gray-500 text-white"
                  : "bg-green-500 text-white"
              )}
              style={{
                width: "150px",
                height: "auto",
                left: 0,
                top: 0,
                transform: `translate(${draggedElement.style?.transform})`,
                opacity: 0.5,
                zIndex: 1000
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-sm">{draggedBooking.name}</div>
                <div className={cn(
                  "text-xs",
                  draggedBooking.type === "block" ? "text-gray-200" : "opacity-75"
                )}>{draggedBooking.email}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        <BookingMoveConfirmationModal
          isOpen={moveConfirmation.isOpen}
          onClose={() => {
            setMoveConfirmation({
              isOpen: false,
              booking: null,
              newDate: null,
              newTime: null,
              newEndTime: null,
              newResource: null
            })
            setDraggedBooking(null)
          }}
          booking={moveConfirmation.booking}
          newDate={moveConfirmation.newDate}
          newTime={moveConfirmation.newTime}
          newEndTime={moveConfirmation.newEndTime}
          newResource={moveConfirmation.newResource}
          onConfirm={handleMoveConfirm}
        />
      </DndContext>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { weekStartsOn: 1 })
    })

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] bg-background sticky left-0 z-10">{t("scheduleTime")}</TableHead>
              {weekDays.map((day) => (
                <TableHead key={day.toISOString()} className="text-center min-w-[200px] border-l border-black" colSpan={serviceResources.length || 1}>
                  {format(day, 'EEE dd.MM')}
                </TableHead>
              ))}
            </TableRow>
            {serviceResources.length > 0 && (
              <TableRow>
                <TableHead className="bg-background sticky left-0 z-10" />
                {weekDays.map((day, dayIndex) => (
                  serviceResources && serviceResources.map((resource, resourceIndex) => {
                    const isFirstResourceOfDay = resourceIndex === 0;
                    return (
                      <TableHead
                        key={`${day.toISOString()}-${resource.$id}`}
                        className={cn(
                          "text-center font-medium text-sm text-muted-foreground",
                          isFirstResourceOfDay && "border-l border-black"
                        )}
                      >
                        {resource.name}
                      </TableHead>
                    );
                  })
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {timeSlots.map((time, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium bg-background sticky left-0 z-10">
                  {time}
                </TableCell>

                {weekDays.map((day) => {
                  const schedule = getDaySchedule(day)
                  if (!schedule?.isWorkingDay) {
                    return serviceResources && serviceResources.length > 0 ? (
                      serviceResources.map((resource, resourceIndex) => {
                        const isFirstResourceOfDay = resourceIndex === 0;
                        return (
                          <TableCell
                            key={`${day.toISOString()}-${resource.$id}`}
                            className={cn(
                              "text-center",
                              isFirstResourceOfDay && "border-l border-black"
                            )}
                          >
                            <Badge variant="destructive" className="w-full justify-center py-2">
                              {t("scheduleStatusClosed")}
                            </Badge>
                          </TableCell>
                        );
                      })
                    ) : (
                      <TableCell key={day.toISOString()} className="text-center border-l border-black">
                        <Badge variant="destructive" className="w-full justify-center py-2">
                          {t("scheduleStatusClosed")}
                        </Badge>
                      </TableCell>
                    )
                  }

                  return serviceResources.length > 0 ? (
                    serviceResources.map((resource, resourceIndex) => {
                      const { status, reason } = getTimeSlotStatus(day, time, resource.$id)
                      const isFirstResourceOfDay = resourceIndex === 0;
                      return (
                        <TableCell
                          key={`${day.toISOString()}-${resource.$id}`}
                          className={cn(
                            "cursor-pointer hover:bg-muted min-w-[100px]",
                            isFirstResourceOfDay && "border-l border-black"
                          )}
                          onClick={() => handleTimeSlotClick(day, time, status, resource)}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={
                                status === 'booked' ? (
                                  (() => {
                                    const booking = weekBookings.find(b => {
                                      const bookingStartMinutes = timeToMinutes(b.start_time)
                                      const bookingEndMinutes = timeToMinutes(b.end_time)
                                      const slotMinutes = timeToMinutes(time)
                                      return b.service_resources.$id === resource.$id &&
                                        slotMinutes >= bookingStartMinutes &&
                                        slotMinutes < bookingEndMinutes
                                    })
                                    return booking?.type === 'block' ? 'destructive' : 'success'
                                  })()
                                ) :
                                  status === 'available' ? 'secondary' :
                                    status === 'break' ? 'warning' :
                                      'destructive'
                              }
                              className="w-full justify-center py-2"
                            >
                              {status === 'available' ? t("scheduleStatusAvailable") :
                                status === 'break' ? t("scheduleStatusBreak") :
                                  status === 'booked' ? (
                                    (() => {
                                      const booking = weekBookings.find(b => {
                                        const bookingStartMinutes = timeToMinutes(b.start_time)
                                        const bookingEndMinutes = timeToMinutes(b.end_time)
                                        const slotMinutes = timeToMinutes(time)
                                        return b.service_resources.$id === resource.$id &&
                                          slotMinutes >= bookingStartMinutes &&
                                          slotMinutes < bookingEndMinutes
                                      })
                                      return booking?.type === 'block' ? t("scheduleStatusBlocked") : t("scheduleStatusBooked")
                                    })()
                                  ) :
                                    t("scheduleStatusClosed")}
                            </Badge>
                            {reason && (
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {reason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )
                    })
                  ) : (
                    <TableCell key={day.toISOString()} className="text-center border-l border-black">
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        {t("scheduleStatusAvailable")}
                      </Badge>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                const newDate = startOfDay(date)
                if (selectedDate && newDate.getTime() === selectedDate.getTime()) {
                  return;
                }
                if (newDate.getMonth() !== currentMonth.getMonth()) {
                  setCurrentMonth(newDate);
                }
                setSelectedDate(newDate);
              }}
              className="rounded-md border bg-white"
              disabled={(date) => {
                const compareDate = startOfDay(date)
                const today = startOfDay(new Date())
                return isBefore(compareDate, today) ||
                  (selectedDate && compareDate.getTime() === selectedDate.getTime())
              }}
              fromDate={new Date()}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={enUS}
              weekStartsOn={1}
            />
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setViewMode('day')}
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {t("scheduleDayView")}
                </Button>
                <Button
                  onClick={() => setIsWeekViewOpen(true)}
                  variant="outline"
                >
                  <CalendarIcon className="mr-1 h-4 w-4 shrink-0" />
                  {t("scheduleWeekView")}
                </Button>
              </div>
              <Button onClick={handleBlockResources} variant="outline" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
                {t("scheduleBlockResources")}
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            {renderDayView()}
          </div>
        </div>

        {isWeekViewOpen && (
          <WeekViewModal
            isOpen={isWeekViewOpen}
            onClose={() => setIsWeekViewOpen(false)}
          >
            {renderWeekView()}
          </WeekViewModal>
        )}
      </div>
    </DndContext>
  )
}