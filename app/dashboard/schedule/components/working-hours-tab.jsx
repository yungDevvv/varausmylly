"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { format, addDays } from "date-fns"
import { enUS, fi } from "date-fns/locale"
import { Coffee, Loader2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModal } from "@/hooks/use-modal"
import { updateDocument } from "@/lib/appwrite/server"
import { useTranslations } from "next-intl"
import { toast } from "@/hooks/use-toast"
import { useSWRConfig } from "swr"

// Memoized time slots component
const TimeSelect = ({ value, onValueChange, disabled, timeSlots }) => {
  const t = useTranslations()
  
  const memoizedContent = useMemo(() => (
    <SelectContent>
      {timeSlots.map(time => (
        <SelectItem key={time} value={time}>
          {time}
        </SelectItem>
      ))}
    </SelectContent>
  ), [timeSlots])

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>
      {memoizedContent}
    </Select>
  )
}

export function WorkingHoursTab({ timeSlots, workingHoursData, selectedServiceId }) {
  const [workingHours, setWorkingHours] = useState(workingHoursData);
  const { onOpen } = useModal()
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations()
  const days = useMemo(() => [0, 1, 2, 3, 4, 5, 6], [])
  const { mutate } = useSWRConfig();
// Handler for updating working hours
const onUpdateWorkingHours = (day, field, value) => {
  setWorkingHours(prev => {
    const currentWorkingHours = typeof prev === 'string' ? JSON.parse(prev) : prev

    return {
      ...currentWorkingHours,
      [day]: {
        ...currentWorkingHours[day],
        [field]: value
      }
    }
  })
}

  const handleUpdateWorkingHours = (day, field, value) => {
    onUpdateWorkingHours(day, field, value);
    setHasChanges(true);
  }

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {

      await updateDocument("main_db", "services", selectedServiceId, {
        days_schedule: JSON.stringify(workingHours, null, 2)
      })
      
      toast({
        title: t("workingHoursSavedTitle"),
        description: t("workingHoursSavedDescription"),
        variant: "success",
      })
      await Promise.all([
        mutate(["/api/service-resources", selectedServiceId]),
        mutate(["/api/bookings", selectedServiceId]),
        mutate(["/api/services", selectedServiceId])
      ]);
      setHasChanges(false)
    } catch (error) {
      console.log(error)
      
      toast({
        title: t("workingHoursErrorTitle"),
        description: t("workingHoursErrorDescription"),
        variant: "internalerror",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("workingHoursDayColumn")}</TableHead>
              <TableHead>{t("workingHoursWorkingDayColumn")}</TableHead>
              <TableHead>{t("workingHoursStartColumn")}</TableHead>
              <TableHead>{t("workingHoursEndColumn")}</TableHead>
              <TableHead>{t("workingHoursBreakColumn")}</TableHead>
              {/* <TableHead>Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map(day => (
              <TableRow key={day}>
                <TableCell className="font-medium capitalize">
                  {format(addDays(new Date(2024, 0, 1), day), 'EEEE', { locale: t("locale") === "fi" ? fi : enUS })}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={workingHours[day].isWorkingDay}
                    onCheckedChange={(checked) => handleUpdateWorkingHours(day, 'isWorkingDay', checked, workingHours[day].$id)}
                  />
                </TableCell>
                <TableCell>
                  <TimeSelect
                    value={workingHours[day].start_time}
                    onValueChange={(value) => handleUpdateWorkingHours(day, 'start_time', value, workingHours[day].$id)}
                    disabled={!workingHours[day].isWorkingDay}
                    timeSlots={timeSlots}
                  />
                </TableCell>
                <TableCell>
                  <TimeSelect
                    value={workingHours[day].end_time}
                    onValueChange={(value) => handleUpdateWorkingHours(day, 'end_time', value, workingHours[day].$id)}
                    disabled={!workingHours[day].isWorkingDay}
                    timeSlots={timeSlots}
                  />
                </TableCell>
                <TableCell>
                  {workingHours[day].breaks
                    ? workingHours[day].breaks.map((break_, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Coffee className="h-4 w-4" />
                        <span>{break_.start} - {break_.end}</span>
                      </div>
                    ))
                    : <span className="text-muted-foreground">{t("workingHoursNoBreaks")}</span>}
                </TableCell>
                <TableCell className="w-[100px]">
                  <Button
                    variant=""
                    onClick={() => onOpen("break-time", { day: workingHours[day], days_schedule: workingHours, selectedServiceId: selectedServiceId  })}
                    disabled={!workingHours[day].isWorkingDay}
                  >
                    {t("workingHoursEditBreaksButton")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasChanges && (
        <div className="fixed bottom-6 right-6 py-6 px-5 rounded-md">
          <div className="flex flex-col items-end space-y-3 relative">
            <X onClick={() => setHasChanges(false)} className="h-4 cursor-pointer hover:text-muted-foreground transition-colors duration-150 w-4 text-black absolute -right-3 -top-3" />
            <Button onClick={handleSaveChanges} className="w-36 h-12 text-base !tracking-widest font-semibold">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("workingHoursSaveButton")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}