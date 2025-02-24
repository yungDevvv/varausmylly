"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { enUS, fi } from "date-fns/locale"
import { useModal } from "@/hooks/use-modal"
import { EllipsisVertical, Pencil, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteDocument } from "@/lib/appwrite/server"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

export function SpecialDaysTab({ specialHours, selectedServiceId }) {
  const { onOpen } = useModal()
  const router = useRouter()
  const t = useTranslations()

  const handleDeleteSpecialDay = async (special) => {
    try {
      await deleteDocument("main_db", "special_days", special.$id);

      toast({
        title: t("specialDayDeletedTitle", { reason: special.reason }),
        description: t("specialDayDeletedDescription"),
        variant: "success",
      })
 
      router.refresh()

    } catch (error) {
      console.log(error)
 
      toast({
        title: t("specialDayErrorTitle"),
        description: t("specialDayErrorDescription"),
        variant: "internalerror",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("specialDaysTitle")}</h3>
        <Button onClick={() => onOpen("special-days", { selectedServiceId })}>
          {t("specialDaysAddButton")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("specialDaysDateColumn")}</TableHead>
              <TableHead>{t("specialDaysReasonColumn")}</TableHead>
              <TableHead>{t("specialDaysStartTimeColumn")}</TableHead>
              <TableHead>{t("specialDaysEndTimeColumn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specialHours && specialHours.length > 0
              ? specialHours.map((special, index) => (
                <TableRow key={index}>
                  <TableCell>{format(parseISO(special.date), 'd MMMM yyyy', { locale: t("locale") === "fi" ? fi : enUS })}</TableCell>
                  <TableCell>{special.reason}</TableCell>
                  <TableCell>{special.start_time}</TableCell>
                  <TableCell>{special.end_time}</TableCell>
                  <TableCell className="max-w-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5">
                          <EllipsisVertical className="w-6 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onOpen("special-days", { specialDay: special, selectedServiceId })}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          {t("specialDaysEditButton")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onOpen("confirm-modal", {
                            title: t("specialDaysDeleteTitle", { reason: special.reason }),
                            description: t("specialDaysDeleteDescription"),
                            callback: () => handleDeleteSpecialDay(special)
                          })}
                          className="cursor-pointer text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          {t("specialDaysDeleteButton")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              : (
                <TableRow className="text-center">
                  <TableCell colSpan={4}>{t("specialDaysNoData")}</TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}