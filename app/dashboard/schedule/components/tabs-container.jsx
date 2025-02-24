"use client"

import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScheduleTab } from "./schedule-tab"
import { WorkingHoursTab } from "./working-hours-tab"
import { SpecialDaysTab } from "./special-days-tab"
import { Card } from "@/components/ui/card"
import { storage } from "@/lib/appwrite/client"
import { useTranslations } from "next-intl"

export default function TabsContainer({ services }) {

  const t = useTranslations()

  const [selectedService, setSelectedService] = useState(null);

  // Time slots memo
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  // Update selectedService when services change
  useEffect(() => {
    if (selectedService) {
      const updatedService = services.find(s => s.$id === selectedService.$id)
      if (updatedService) {
        setSelectedService(updatedService)
      }
    }
  }, [services])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("scheduleTitle")}</h2>
        <p className="text-muted-foreground">
          {t("scheduleDescription")}
        </p>
      </div>

      {!selectedService ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.$id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
              onClick={() => setSelectedService(service)}
            >
              <div className="relative h-48 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0 z-10" />
                <img
                  src={storage.getFilePreview("service_images", service.image)}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <h3 className="text-lg font-medium text-white mb-1 group-hover:text-primary-foreground transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {t("scheduleClickToView")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList>
            <TabsTrigger value="schedule">{t("scheduleTab")}</TabsTrigger>
            <TabsTrigger value="working-hours">{t("workingHoursTab")}</TabsTrigger>
            <TabsTrigger value="special-days">{t("specialDaysTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-medium"><span className="font-semibold"># </span>{selectedService.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="mr-1">←</span> {t("backToServices")}
                </button>
              </div>
  
              <ScheduleTab
                workingHours={JSON.parse(selectedService.days_schedule)}
                specialHours={selectedService.special_days}
                selectedService={selectedService}
              />
            </div>
          </TabsContent>

          <TabsContent value="working-hours">
            <WorkingHoursTab
              workingHoursData={JSON.parse(selectedService.days_schedule)}
              timeSlots={timeSlots}
              selectedServiceId={selectedService.$id}
            />
          </TabsContent>

          <TabsContent value="special-days">
            <SpecialDaysTab
              specialHours={selectedService.special_days}
              selectedServiceId={selectedService.$id}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
