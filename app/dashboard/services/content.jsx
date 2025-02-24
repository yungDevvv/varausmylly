"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, MapPin, BadgeEuro, EllipsisVertical, Pencil, Trash, Table2, Search, } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useModal } from "@/hooks/use-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { storage } from "@/lib/appwrite/client"
import { deleteDocument, listDocuments } from "@/lib/appwrite/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export default function ServicePageContent({ services }) {
  const { onOpen } = useModal();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const router = useRouter()
  const t = useTranslations();


  const handleDeleteService = async (service_id) => {
    try {
      await deleteDocument("main_db", "services", service_id);
      toast({
        title: t("serviceDeletedTitle"),
        description: t("serviceDeletedMessage"),
        variant: "success",
      })
      router.refresh()
    } catch (error) {
      console.log(error);
      toast({
        title: t("serviceErrorTitle"),
        description: t("serviceErrorMessage"),
        variant: "internalerror",
      })
    }
  };

  const handleDeleteResource = async (resource_id) => {
    try {
      await deleteDocument("main_db", "service_resources", resource_id);

      setResources(resources.filter(resource => resource.$id !== resource_id));

      toast({
        title: t("resourceDeletedTitle"),
        description: t("resourceDeletedMessage"),
        variant: "success",
      })
    } catch (error) {
      console.log(error)
      toast({
        title: t("resourceErrorTitle"),
        description: t("resourceErrorMessage"),
        variant: "internalerror",
      })
    }
  };

  useEffect(() => {
    if (selectedService === "all") {
      setResources(services.map(service => service.service_resources).flat());
    } else {
      const filteredResources = services.find(service => service.$id === selectedService)?.service_resources || [];
      setResources(filteredResources);
    }
  }, [selectedService, services]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("servicesTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("servicesDescription")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-8 max-w-[250px] bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="services" className="">
        <TabsList>
          <TabsTrigger value="services">
            {t("servicesTab")}
          </TabsTrigger>
          <TabsTrigger value="resources">
            {t("resourcesTab")}
          </TabsTrigger>
        </TabsList>

        {/* Services List */}
        <TabsContent value="services">
          <div className="w-full flex justify-end my-2">
            <Button className="ml-auto" onClick={() => onOpen("service")}>
              <Plus className="w-4 h-4 mr-1" />
              {t("addServiceBtn")}
            </Button>
          </div>

          <div className="grid gap-3">
            {services.map((service) => (
              <div
                key={service.$id}
                className={cn(
                  "group relative flex items-center rounded-xl h-40 border bg-gradient-to-r from-card to-card/50 hover:shadow-lg transition-all duration-300 overflow-hidden",
                  !service.isActive && "opacity-75 grayscale"
                )}
              >
                {/* Image Section */}
                <div className="relative w-52 h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                  <img
                    src={storage.getFilePreview("service_images", service.image)}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl">
                        {service.description}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5">
                            <EllipsisVertical className="w-6 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onOpen("service", { service, edit: true })}
                            className="cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            {t("editBtn")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onOpen("confirm-modal", {
                              title: t("deleteServiceTitle"),
                              description: t("deleteServiceMessage"),
                              callback: () => handleDeleteService(service.$id)
                            })}
                            className="cursor-pointer text-destructive"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            {t("deleteBtn")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex gap-8 mt-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <span>{t("playersUpTo")} {service.maxPlayers}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <BadgeEuro className="w-4 h-4 text-primary" />
                        </div>
                        <span>{service.price} € / {t("perHour")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <span>{service.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={cn(
                  "absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium z-10",
                  service.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {service.isActive ? t("statusActive") : t("statusInactive")}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Resources List */}
        <TabsContent value="resources" className="space-y-4">
          <div className="flex items-center justify-between my-2">
            <Select
              value={selectedService}
              onValueChange={setSelectedService}
            >
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder={t("filterByService")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allServices")}</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.$id} value={service.$id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => onOpen("resource", { services })}>
              <Plus className="w-4 h-4 mr-1" />
              {t("addResourceBtn")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.$id}
                className="group relative bg-white rounded-lg border hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {resource.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {services.find(service =>
                          service.service_resources.some(r => r.$id === resource.$id)
                        )?.name || t("noServiceAssigned")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <EllipsisVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onOpen("resource", { resource, services, edit: true })}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          {t("editBtn")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onOpen("confirm-modal", {
                            title: t("deleteResourceTitle"),
                            description: t("deleteResourceMessage"),
                            callback: () => handleDeleteResource(resource.$id)
                          })}
                          className="cursor-pointer text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          {t("deleteBtn")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("statusLabel")}</span>
                      <Badge variant={resource.isAvailable ? "success" : "secondary"}>
                        {resource.isAvailable ? t("statusAvailable") : t("statusInUse")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
