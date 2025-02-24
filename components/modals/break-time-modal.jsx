"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/use-modal"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import { updateDocument } from "@/lib/appwrite/server"
import { useRouter } from "next/navigation"
import { addDays, format } from "date-fns"
import { useTranslations } from 'next-intl'
import { useToast } from "@/hooks/use-toast"
import { enUS, fi } from "date-fns/locale"
import { useSWRConfig } from "swr"

export default function BreakTimeModal() {
    const [isLoading, setIsLoading] = useState(false)
    const { isOpen, onClose, type, data } = useModal()
    const router = useRouter()
    const t = useTranslations()
    const { toast } = useToast()
    const [breaks, setBreaks] = useState(data?.day?.breaks ? data?.day?.breaks : [])
    const isModalOpen = isOpen && type === "break-time"
    const locale = t('locale') === 'fi' ? fi : enUS
    const { mutate } = useSWRConfig();
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0')
        return `${hour}:00`
    })

    const handleAddBreak = () => {
        setBreaks([...breaks, { start: "09:00", end: "10:00" }])
    }

    const handleRemoveBreak = (index) => {
        setBreaks(breaks.filter((_, i) => i !== index))
    }

    const handleChangeBreak = (index, field, value) => {
        setBreaks(breaks.map((break_, i) =>
            i === index ? { ...break_, [field]: value } : break_
        ))
    }

    const handleSave = async () => {
        setIsLoading(true)
        const updatedDaysSchedule = {
            ...data?.days_schedule,
            [data?.day?.day_index === 0 ? 0 : data?.day?.day_index - 1]: {
                ...data?.days_schedule[data?.day?.day_index === 0 ? 0 : data?.day?.day_index - 1],
                breaks: breaks
            }
        }
        try {
            await updateDocument("main_db", "services", data.selectedServiceId, {
                days_schedule: JSON.stringify(updatedDaysSchedule, null, 2)
            })

         
            router.refresh();

            toast({
                title: t("breakTimeSaveSuccess"),
                description: t("breakTimeSaveSuccessDesc"),
                variant: "success"
            })

            onClose();
        } catch (error) {
            console.log(error)
            toast({
                title: t("breakTimeSaveError"),
                description: t("breakTimeSaveErrorDesc"),
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t("breakTimeTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("breakTimeDescription")} <span className="font-medium text-black tracking-widest">
                            {format(addDays(new Date(2024, 0, 1), data?.day?.day_index), 'EEEE', { locale })}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {breaks.map((break_, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <Select
                                value={break_.start}
                                onValueChange={(value) => handleChangeBreak(index, 'start', value)}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder={t("breakTimeSelectTime")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeSlots.map(time => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <span>-</span>

                            <Select
                                value={break_.end}
                                onValueChange={(value) => handleChangeBreak(index, 'end', value)}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder={t("breakTimeSelectTime")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeSlots.map(time => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveBreak(index)}
                                title={t("breakTimeRemove")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        onClick={handleAddBreak}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("breakTimeAdd")}
                    </Button>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("breakTimeSaving")}
                            </>
                        ) : t("breakTimeSave")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
