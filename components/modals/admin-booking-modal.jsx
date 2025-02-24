"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { format, parse, addMinutes } from "date-fns"
import { useTranslations } from 'next-intl'
import { fi, enUS } from 'date-fns/locale'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useModal } from "@/hooks/use-modal"
import { createDocument, updateDocument } from "@/lib/appwrite/server"
import { toast } from "@/hooks/use-toast"
import { useSWRConfig } from "swr"
import { useRouter } from "next/navigation"

const AdminBookingModal = () => {
  const { isOpen, type, data, onClose } = useModal();
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreate, setIsCreate] = useState(true);
  const router = useRouter();
  const t = useTranslations();
  const isModalOpen = isOpen && type === "admin-booking";

  // Get booking data directly from data object
  const booking = data?.booking;
  const edit = data?.edit;


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: booking?.name || "",
      email: booking?.email || "",
      phone: booking?.phone || "",
      start_time: booking?.start_time || data?.start_time || "09:00",
      end_time: booking?.end_time || data?.end_time || "10:00",
      additional_information: booking?.additional_information || "",
    }
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isModalOpen && booking) {
      console.log("AdminBookingModal - Setting form values:", booking);
      setValue("name", booking.name || "");
      setValue("email", booking.email || "");
      setValue("phone", booking.phone || "");
      setValue("start_time", booking.start_time || "09:00");
      setValue("end_time", booking.end_time || "10:00");
      setValue("additional_information", booking.additional_information || "");
    }
  }, [isModalOpen, booking, setValue]);

  // Get schedule for the selected day
  const getDaySchedule = () => {
    // When editing, use booking data
    if (edit && booking) {
      const resource = booking.service_resources;
      if (!resource?.services?.days_schedule) return null;
      const schedule = JSON.parse(resource.services.days_schedule);
      const dayIndex = new Date(booking.date).getDay();
      const daySchedule = schedule[dayIndex];
      return daySchedule;
    }

    // When creating new, use data.resource
    if (!data?.resource?.services?.days_schedule) return null;
    const schedule = JSON.parse(data.resource.services.days_schedule);
    const dayIndex = new Date(data?.date || new Date()).getDay();
    const daySchedule = schedule[dayIndex];
    return daySchedule;
  };

  // Generate time slots based on slotSteps
  const generateTimeSlots = (startTime, endTime, slotSteps) => {
    console.log("Generating time slots:", { startTime, endTime, slotSteps });
    const slots = [];
    let currentTime = parse(startTime, 'HH:mm', new Date());
    const endDateTime = parse(endTime, 'HH:mm', new Date());

    while (currentTime < endDateTime) {
      slots.push(format(currentTime, "HH:mm"));
      currentTime = addMinutes(currentTime, slotSteps);
    }

    return slots;
  };

  // Generate available time slots
  const daySchedule = getDaySchedule();
  const slotSteps = edit && booking
    ? (booking.service_resources?.services?.slotSteps || 30)
    : (data?.resource?.services?.slotSteps || 30);


  const timeSlots = daySchedule?.isWorkingDay
    ? generateTimeSlots(daySchedule.start_time, daySchedule.end_time, slotSteps)
    : [];


  // Generate available end times based on selected start time and slotSteps
  const startTime = watch("start_time");
  const isLastHour = startTime === timeSlots[timeSlots.length - 1];

  // When last hour is selected, automatically set end time
  useEffect(() => {
    if (isLastHour && daySchedule?.end_time) {
      setValue("end_time", daySchedule.end_time);
    }
  }, [isLastHour, daySchedule?.end_time, setValue]);

  const availableEndTimes = !isLastHour ? timeSlots.filter(time => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(time, 'HH:mm', new Date());
    const maxDuration = edit && booking
      ? (booking.service_resources?.services?.maxDuration || 1)
      : (data?.resource?.services?.maxDuration || 1);

    return end > start &&
      (end.getTime() - start.getTime()) / (1000 * 60 * 60) <= maxDuration;
  }) : [daySchedule?.end_time];

  useEffect(() => {
    if (booking && edit) {
      setIsEditing(false);
      setIsCreate(false);
    }
  }, [booking, edit]);

  const onSubmit = async (values) => {
    // Validate end time for last hour
    if (isLastHour && values.end_time !== daySchedule?.end_time) {
      values.end_time = daySchedule.end_time;
    }

    console.log("Submitting values:", values);

    try {
      if (isCreate) {
        await createDocument("main_db", "bookings", {
          body: {
            ...values,
            date: format(data?.date || new Date(), 'yyyy-MM-dd'),
            service_resources: data?.resource?.$id,
            service_id: data?.resource.services.$id,
            type: "booking"
          }
        });

        toast({
          title: t("adminBookingTitle"),
          description: t("adminBookingCreated"),
          variant: "success",
        })

      } else {
        await updateDocument("main_db", "bookings", booking.$id, {
          ...values,
        });

        toast({
          title: t("adminBookingTitle"),
          description: t("adminBookingUpdated"),
          variant: "success",
        })
      }

      const serviceId = isCreate 
        ? data?.resource?.services?.$id 
        : booking?.service_resources?.services?.$id;
      
      const date = isCreate
        ? format(data?.date || new Date(), 'yyyy-MM-dd')
        : format(new Date(booking.date), 'yyyy-MM-dd');

    
      await Promise.all([
        mutate(["service_resources", serviceId]),
        mutate(["bookings", serviceId, date]),
        mutate(["bookings"])
      ]);

      router.refresh();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: t("adminBookingErrorTitle"),
        description: t("adminBookingErrorDescription"),
        variant: "internalerror",
      })
    }
  };

  const handleClose = () => {
    reset();
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle>{isCreate ? t("adminBookingCreateTitle") : t("adminBookingDetailsTitle")}</DialogTitle>
          </div>
          {isCreate && (
            <div className="flex flex-col space-y-1 text-sm">
              <div>
                <span className="font-medium">{t("adminBookingService")}: </span>
                {data?.resource?.services?.name}
              </div>
              <div>
                <span className="font-medium">{t("adminBookingResource")}: </span>
                {data?.resource?.name}
              </div>
              <div>
                <span className="font-medium">{t("adminBookingDate")}: </span>
                {format(data?.date || new Date(), 'dd.MM.yyyy')}
              </div>
            </div>
          )}
          {!isCreate && (
            <div className="flex flex-col space-y-1 text-sm">
              <div>
                <span className="font-semibold">{t("adminBookingService")}: </span>
                {booking?.service_resources?.services?.name}
              </div>
              <div>
                <span className="font-semibold">{t("adminBookingResource")}: </span>
                {booking?.service_resources?.name}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{t("adminBookingDate")}: </span>
                  {booking?.date && format(new Date(booking.date), "dd.MM.yyyy", { locale: t("locale") === "fi" ? fi : enUS })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t("adminBookingEdit")}</span>
                  <Switch
                    checked={isEditing}
                    onCheckedChange={setIsEditing}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("adminBookingName")} *</label>
              <Input
                {...register("name", { required: t("adminBookingNameRequired") })}
                placeholder={t("adminBookingNamePlaceholder")}
                disabled={!isEditing && !isCreate}
                className="mt-1"
              />
              {errors.name && (
                <span className="text-sm text-red-500">{errors.name.message}</span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t("adminBookingEmail")} *</label>
              <Input
                {...register("email", {
                  required: t("adminBookingEmailRequired"),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t("adminBookingEmailInvalid")
                  }
                })}
                type="email"
                placeholder={t("adminBookingEmailPlaceholder")}
                disabled={!isEditing && !isCreate}
                className="mt-1"
              />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t("adminBookingPhone")}</label>
              <Input
                {...register("phone")}
                type="tel"
                placeholder={t("adminBookingPhonePlaceholder")}
                disabled={!isEditing && !isCreate}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("adminBookingStartTime")} *</label>
                <Select
                  defaultValue={watch("start_time")}
                  value={watch("start_time")}
                  onValueChange={(value) => setValue("start_time", value)}
                  disabled={!isEditing && !isCreate}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue>{watch("start_time") || t("adminBookingSelectStartTime")}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">{t("adminBookingEndTime")} *</label>
                <Select
                  defaultValue={watch("end_time")}
                  value={watch("end_time")}
                  onValueChange={(value) => setValue("end_time", value)}
                  disabled={(!isEditing && !isCreate) || isLastHour}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue>{isLastHour ? daySchedule?.end_time : (watch("end_time") || t("adminBookingSelectEndTime"))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableEndTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t("adminBookingAdditionalInfo")}</label>
              <Textarea
                {...register("additional_information")}
                placeholder={t("adminBookingAdditionalInfoPlaceholder")}
                className="mt-1 resize-none min-h-28"
                disabled={!isEditing && !isCreate}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2">
            {isEditing && !isCreate && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  {t("adminBookingCancel")}
                </Button>
                <Button type="submit">
                  {t("adminBookingSaveChanges")}
                </Button>
              </>
            )}
            {isCreate && (
              <Button type="submit">
                {t("adminBookingCreateButton")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBookingModal;