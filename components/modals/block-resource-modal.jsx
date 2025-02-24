"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/use-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useTranslations } from 'next-intl'
import DateInput from "../date-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createDocument, updateDocument } from "@/lib/appwrite/server"
import { useUser } from "@/context/user-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function BlockResourceModal() {
    const { isOpen, onClose, type, data } = useModal()
    const isModalOpen = isOpen && type === "block-resource"
    const {user} = useUser();
    const router = useRouter();
    const {toast} = useToast();
    const t = useTranslations();

    const formSchema = z.object({
        reason: z.string().min(2, {
            message: t("blockResourceReasonRequired"),
        }),
        start_time: z.string(),
        end_time: z.string(),
        resources: z.array(z.string()).min(1, {
            message: t("blockResourceSelectRequired"),
        }),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: "",
            start_time: "09:00",
            end_time: "22:00",
            resources: [],
        }
    })
 
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0')
        return `${hour}:00`
    })

    const onSubmit = async (values) => {
        try {
            await Promise.all(
                values.resources.map(resourceId =>
                    createDocument("main_db", "bookings", {
                        body: {
                            name: values.reason,
                            email: user?.email,
                            start_time: values.start_time,
                            end_time: values.end_time,
                            date: format(data.date, 'yyyy-MM-dd'),
                            service_id: data.service.$id,
                            type: "block",
                            service_resources: resourceId
                        }
                    })
                )
            );
            
            router.refresh();
            
            toast({
                title: t("blockResourceSuccessTitle"),
                description: t("blockResourceSuccessDescription"),
                variant: "success",
            });

        } catch (error) {
            console.log(error);
            toast({
                title: t("blockResourceErrorTitle"),
                description: t("blockResourceErrorDescription"),
                variant: "internalerror",
            });
        }
    }
 
    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>{t("blockResourceTitle")}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("blockResourceDate")}</label>
                            <DateInput form={form} name="date" label={t("blockResourceDate")} />
                        </div>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("blockResourceReasonLabel")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("blockResourceReasonPlaceholder")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("blockResourceStartTime")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("blockResourceSelectTime")} />
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
                                        <FormLabel>{t("blockResourceEndTime")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("blockResourceSelectTime")} />
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

                        <FormField
                            control={form.control}
                            name="resources"
                            render={() => (
                                <FormItem>
                                    <FormLabel>{t("blockResourceSelectLabel")}</FormLabel>
                                    <ScrollArea className="h-[200px] rounded-md border p-4">
                                        {data?.resources?.map((resource) => (
                                            <FormField
                                                key={resource.$id}
                                                control={form.control}
                                                name="resources"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={resource.$id}
                                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(resource.$id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, resource.$id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== resource.$id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {resource.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">
                                {t("blockResourceSubmit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
