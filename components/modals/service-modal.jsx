"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Upload } from "lucide-react"
import { useModal } from "@/hooks/use-modal"
import { useEffect, useState, useRef } from "react"
import { storage } from "@/lib/appwrite/client"
import { ID } from "appwrite"
import { createDocument, updateDocument } from "@/lib/appwrite/server"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

// Default working hours structure
const WeekDaysTemplate = {
    monday: {
        day_index: 0,
        start_time: "09:00",
        end_time: "17:00",
        isWorkingDay: true,
        breaks: [
            {
                "start": "12:00",
                "end": "13:00"
            }
        ]
    },
    tuesday: {
        day_index: 1,
        start_time: "09:00",
        end_time: "17:00",
        isWorkingDay: true,
        breaks: [
            {
                "start": "12:00",
                "end": "13:00"
            }
        ]
    },
    wednesday: {
        day_index: 2,
        start_time: "09:00",
        end_time: "17:00",
        isWorkingDay: true,
        breaks: [
            {
                "start": "12:00",
                "end": "13:00"
            }
        ]
    },
    thursday: {
        day_index: 3,
        start_time: "09:00",
        end_time: "17:00",
        isWorkingDay: true,
        breaks: [
            {
                "start": "12:00",
                "end": "13:00"
            }
        ]
    },
    friday: {
        day_index: 4,
        start_time: "09:00",
        end_time: "17:00",
        isWorkingDay: true,
        breaks: [
            {
                "start": "12:00",
                "end": "13:00"
            }
        ]
    },
    saturday: {
        day_index: 5,
        start_time: "10:00",
        end_time: "15:00",
        isWorkingDay: false,
        breaks: []
    },
    sunday: {
        day_index: 6,
        start_time: "10:00",
        end_time: "15:00",
        isWorkingDay: false,
        breaks: []
    }
}

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name is required",
    }),
    description: z.string().min(2, {
        message: "Description is required",
    }),
    price: z.number().min(1, {
        message: "Price must be at least 1",
    }),
    maxPlayers: z.number().min(1, {
        message: "Max players must be at least 1",
    }),
    location: z.string().min(2, {
        message: "Location is required",
    }),
    slotSteps: z.number().min(30, {
        message: "Slot steps must be at least 30 minutes",
    }),
    maxDuration: z.number().min(1, {
        message: "Max duration must be at least 1 hour",
    }),
})

export default function ServiceModal() {
    const { isOpen, onClose, type, data } = useModal()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [preview, setPreview] = useState("")
    const fileInputRef = useRef(null)
    const router = useRouter()
    const isModalOpen = isOpen && type === "service"
    const t = useTranslations()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 1,
            maxPlayers: 1,
            location: "",
            slotSteps: 30,
            maxDuration: 1,
        }
    })

    async function onSubmit(values) {
        try {
            setIsLoading(true)

            const serviceData = {
                ...values,
                isActive: true,
            }

            if (selectedFile) {
                const fileId = await storage.createFile(
                    "service_images",
                    ID.unique(),
                    selectedFile
                )
                serviceData.image = fileId.$id
            }

            if (data?.edit) {
                await updateDocument("main_db", "services", data.service.$id, { ...serviceData })
            } else {
                await createDocument("main_db", "services", {
                    body: {
                        ...serviceData,
                        days_schedule: JSON.stringify(WeekDaysTemplate)
                    }
                })
            }
            router.refresh()
            form.reset()
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        form.reset()
        setSelectedFile(null)
        setPreview("")
        onClose()
    }

    useEffect(() => {
        if (!isModalOpen) {
            form.reset({
                name: "",
                description: "",
                price: 1,
                maxPlayers: 1,
                location: "",
                slotSteps: 30,
                maxDuration: 1,
            })
            setSelectedFile(null)
            setPreview("")
        } else if (data?.edit) {
            
            form.reset({
                name: data.service.name || "",
                description: data.service.description || "",
                price: Number(data.service.price) || 1,
                maxPlayers: Number(data.service.maxPlayers) || 1,
                location: data.service.location || "",
                slotSteps: Number(data.service.slotSteps) || 30,
                maxDuration: Number(data.service.maxDuration) || 1,
            })
        }
    }, [isModalOpen, data?.edit])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            const previewUrl = URL.createObjectURL(file)
            setPreview(previewUrl)
        }
    }

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview)
            }
        }
    }, [preview])

    return (
        <Dialog open={isModalOpen} onOpenChange={() => {
            handleClose();
            form.reset()
            setSelectedFile(null)
            setPreview("")
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {data?.service ? t("serviceModalEditTitle") : t("serviceModalAddTitle")}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("serviceModalNameLabel")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("serviceModalNamePlaceholder")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("serviceModalDescriptionLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="min-h-28"
                                            placeholder={t("serviceModalDescriptionPlaceholder")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("serviceModalPriceLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                placeholder={t("serviceModalPricePlaceholder")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxPlayers"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("serviceModalMaxPlayersLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                placeholder={t("serviceModalMaxPlayersPlaceholder")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="slotSteps"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("serviceModalSlotStepsLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="30"
                                                step="30"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                placeholder={t("serviceModalSlotStepsPlaceholder")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxDuration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("serviceModalMaxDurationLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="24"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                placeholder={t("serviceModalMaxDurationPlaceholder")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("serviceModalLocationLabel")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("serviceModalLocationPlaceholder")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>{t("serviceModalImageLabel")}</FormLabel>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <div className="flex flex-col gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-full"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {selectedFile ? selectedFile.name : t("serviceModalChooseImage")}
                                </Button>

                                {preview ? (
                                    <div className="relative w-full max-h-40 aspect-video rounded-lg overflow-hidden">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : data?.edit && data?.service?.image ? (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden max-h-40">
                                        <img
                                            src={storage.getFilePreview("service_images", data.service.image)}
                                            alt={data.service.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </FormItem>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t("serviceModalCancelBtn")}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {data?.service ? t("serviceModalSaveBtn") : t("serviceModalCreateBtn")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
