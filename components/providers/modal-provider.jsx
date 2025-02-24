"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import ServiceModal from "@/components/modals/service-modal";
import BreakTimeModal from "@/components/modals/break-time-modal";
import SpecialDaysModal from "@/components/modals/special-days-modal";
import BlockResourceModal from "@/components/modals/block-resource-modal";
import ConfirmModal from "@/components/modals/confirm-modal";
import ResourceModal from "@/components/modals/resource-modal";
import AdminBookingModal from "@/components/modals/admin-booking-modal";

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);
    const { isOpen, type } = useModal();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <ServiceModal />
            {isOpen && type === "break-time" && <BreakTimeModal />}
            {isOpen && type === "admin-booking" && <AdminBookingModal />}
            <SpecialDaysModal />
            <BlockResourceModal />
            <ResourceModal />
            <ConfirmModal />
        </>
    );
};