"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useModal } from "@/hooks/use-modal"
import { useTranslations } from 'next-intl'

const ConfirmModal = () => {
    const { isOpen, type, onClose, data } = useModal();
    const t = useTranslations();
    const isModalOpen = isOpen && type === "confirm-modal";

    return (
        <AlertDialog open={isModalOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{data.title || t("confirmModalDefaultTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {data.description || t("confirmModalDefaultDescription")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("confirmModalCancel")}</AlertDialogCancel>
                    {data?.type === "mail" ? (
                        <AlertDialogAction 
                            onClick={() => data.callback()} 
                            className="bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                            {t("confirmModalConfirm")}
                        </AlertDialogAction>
                    ) : (
                        <AlertDialogAction 
                            onClick={() => data.callback()} 
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {t("confirmModalDelete")}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default ConfirmModal;