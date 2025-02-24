"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useModal } from "@/hooks/use-modal"
import { createDocument, updateDocument } from "@/lib/appwrite/server"
import { useTranslations } from "next-intl"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Separator } from "../ui/separator"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "resourceModalNameError",
    }),
    services: z.string().min(1, {
        message: "resourceModalServiceError",
    }),
    isActive: z.boolean().default(false),
})

export default function ResourceModal() {
    const { isOpen, onClose, type, data } = useModal()
    const isModalOpen = isOpen && type === "resource"
    const router = useRouter()
    const t = useTranslations()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            services: "",
            isActive: true,
        }
    })

    const isLoading = form.formState.isSubmitting

    const onSubmit = async (values) => {
        try {
            if (data?.edit) {
                await updateDocument("main_db", "service_resources", data.resource.$id, { ...values })
                toast({
                    title: "Resource",
                    description: "Resource updated successfully",
                    variant: "success",
                })
            } else {
                await createDocument("main_db", "service_resources", { body: values })
                toast({
                    title: "Resource",
                    description: "Resource created successfully",
                    variant: "success",
                })
            }

            router.refresh()
            form.reset()
            onClose()
        } catch (error) {
            console.log(error)
            toast({
                title: "Error",
                description: "Failed to create or update resource",
                variant: "internalerror",
            })
        }
    }

    const handleClose = () => {
        form.reset()
        onClose()
    }

    useEffect(() => {
        if (data?.resource && isModalOpen) {
            form.setValue("name", data.resource.name || "")
            form.setValue("services", data.resource.services || "")
            form.setValue("isActive", data.resource.isActive || true)

        } else {
            form.reset({
                name: "",
                services: "",
                isActive: true,
            })
        }
    }, [isModalOpen, data?.resource, form])

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>
                        {data?.edit ? t("resourceModalEditTitle") : t("resourceModalCreateTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {data?.edit
                            ? t("resourceModalEditDescription")
                            : t("resourceModalCreateDescription")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("resourceModalNameLabel")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("resourceModalNamePlaceholder")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="services"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("resourceModalServiceLabel")}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("resourceModalServicePlaceholder")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {data?.services?.map((service) => (
                                                <SelectItem
                                                    key={service.$id}
                                                    value={service.$id}
                                                >
                                                    {service.name}
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
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <FormLabel>{t("resourceModalAvailableLabel")}</FormLabel>
                                        <FormDescription>
                                            {t("resourceModalAvailableDescription")}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                {t("resourceModalCancelBtn")}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {data?.edit ? t("resourceModalSaveBtn") : t("resourceModalCreateBtn")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
