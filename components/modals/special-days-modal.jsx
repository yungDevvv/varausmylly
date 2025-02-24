"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/use-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useTranslations } from 'next-intl'
import DateInput from "../date-input"
import { createDocument, updateDocument } from "@/lib/appwrite/server"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export default function SpecialHoursModal() {
    const { isOpen, onClose, type, data } = useModal()
    const isModalOpen = isOpen && type === "special-days"
    const router = useRouter();
    const t = useTranslations();

    const formSchema = z.object({
        date: z.date(),
        reason: z.string().min(2, {
            message: t("specialDayReasonRequired"),
        }),
        start_time: z.string(),
        end_time: z.string(),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(),
            reason: "",
            start_time: "09:00",
            end_time: "22:00",
        }
    })

    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0')
        return `${hour}:00`
    })

    const onSubmit = async (values) => {
        try {
            if (data?.specialDay) {
                await updateDocument("main_db", "special_days", data.specialDay.$id, {
                    date: format(values.date, 'yyyy-MM-dd'),
                    reason: values.reason,
                    start_time: values.start_time,
                    end_time: values.end_time,
                    services: data.selectedServiceId
                })
                console.log("Updated special day:", values, data.selectedServiceId)
                toast({
                    title: t("specialDayUpdateSuccess"),
                    description: t("specialDayUpdateSuccessDesc"),
                    variant: "success",
                })
                onClose();
                return;
            }
            await createDocument("main_db", "special_days", {
                body: {
                    date: format(values.date, 'yyyy-MM-dd'),
                    reason: values.reason,
                    start_time: values.start_time,
                    end_time: values.end_time,
                    services: data.selectedServiceId
                }
            })

            toast({
                title: t("specialDayCreateSuccess"),
                description: t("specialDayCreateSuccessDesc"),
                variant: "success",
            })
            onClose();
        } catch (error) {
            console.log(error)
            toast({
                title: t("specialDayError"),
                description: t("specialDayErrorDesc"),
                variant: "internalerror",
            })
        } finally {
            router.refresh();

            form.reset();
        }
    }

    useEffect(() => {
        if (data?.specialDay) {
            form.reset({
                date: new Date(data.specialDay.date),
                reason: data.specialDay.reason,
                start_time: data.specialDay.start_time,
                end_time: data.specialDay.end_time
            })
        }
        return () => {
            document.body.style.pointerEvents = "auto";
        }
    }, [data, form])

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {data?.specialDay ? t("specialDayEditTitle") : t("specialDayAddTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("specialDayDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Date input at the top */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("specialDayDate")}</label>
                            <div className="relative z-50">
                                <DateInput form={form} name="date" label={t("specialDayDate")} />
                            </div>
                        </div>

                        {/* Reason input */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("specialDayReasonLabel")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("specialDayReasonPlaceholder")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Time inputs */}
                        <div className="grid grid-cols-2 gap-4 relative z-40">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("specialDayOpeningTime")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("specialDaySelectTime")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("specialDayClosingTime")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("specialDaySelectTime")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">
                                {t("specialDaySave")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
