"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Search, Filter, ChevronLeft, ChevronRight, Loader2, User2, GamepadIcon, Euro, Timer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useModal } from "@/hooks/use-modal"
import { useEffect, useState } from "react"
import { listDocuments } from "@/lib/appwrite/server"
import { storage } from "@/lib/appwrite/client"
import { Badge } from "@/components/ui/badge"
import { format, isBefore, isToday, parseISO, startOfDay } from "date-fns"
import { useTranslations } from "next-intl"

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { onOpen } = useModal();
  const t = useTranslations();

  // Group bookings by their timing
  const groupedBookings = bookings.reduce((acc, booking) => {
    const bookingDate = parseISO(`${booking.date}T${booking.start_time}`)
    const now = new Date()

    if (isToday(bookingDate)) {
      if (isBefore(bookingDate, now)) {
        acc.todayPast.push(booking)
      } else {
        acc.todayUpcoming.push(booking)
      }
    } else if (isBefore(bookingDate, startOfDay(now))) {
      acc.past.push(booking)
    } else {
      acc.upcoming.push(booking)
    }

    return acc
  }, {
    todayUpcoming: [],
    todayPast: [],
    upcoming: [],
    past: []
  })

  // Sort each group by date and time
  const sortByDateTime = (a, b) => {
    const dateA = parseISO(`${a.date}T${a.start_time}`)
    const dateB = parseISO(`${b.date}T${b.start_time}`)
    return dateA.getTime() - dateB.getTime()
  }

  groupedBookings.todayUpcoming.sort(sortByDateTime)
  groupedBookings.todayPast.sort(sortByDateTime)
  groupedBookings.upcoming.sort(sortByDateTime)
  groupedBookings.past.sort((a, b) => sortByDateTime(b, a)) // Reverse sort for past bookings

  useEffect(() => {
    setIsLoading(true);
    const fetchBookings = async () => {
      try {
        const { documents: bookings } = await listDocuments("main_db", "bookings", [
          { type: "equal", name: "type", value: "booking" }
        ]);
        // console.log(bookings)
        setBookings(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("bookingsPageTitle")}</h2>
          <p className="text-muted-foreground">
            {t("bookingsPageDescription")}
          </p>
        </div>
      </div>
      {/* Bookings List */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-80 max-xl:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder={t("bookingsSearchPlaceholder")}
            className="pl-10 w-full bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("bookingsStatusAll")}</SelectItem>
              <SelectItem value="upcoming">{t("bookingsStatusUpcoming")}</SelectItem>
              <SelectItem value="completed">{t("bookingsStatusCompleted")}</SelectItem>
              <SelectItem value="cancelled">{t("bookingsStatusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] bg-white">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("bookingsServiceAll")}</SelectItem>
              <SelectItem value="pool1">Pool Table</SelectItem>
              <SelectItem value="bowling1">Bowling</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        {!isLoading && bookings.length > 0 && (
          <>
            {/* Today's Upcoming Bookings */}
            {groupedBookings.todayUpcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">{t("bookingsTodayUpcoming")}</h3>
                {groupedBookings.todayUpcoming.map((booking) => (
                  <Card key={booking.$id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary">
                    <div className="flex items-center px-6 py-4 gap-4">
                      {/* Left Section - Service Icon */}
                      <div className="w-[100px] h-[70px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={storage.getFilePreview("service_images", booking.service_resources.services.image)}
                          alt={booking.service}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col flex-grow gap-2">
                        <div className="flex items-center gap-2">
                          <GamepadIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{booking.service_resources.services.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {booking.service_resources.name}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User2 className="w-4 h-4" />
                          <span>{booking.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4" />
                          <span className="font-medium">
                            {t("bookingsPricePerHour", { price: booking.service_resources.services.price })}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Today's Past Bookings */}
            {groupedBookings.todayPast.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-muted-foreground">{t("bookingsTodayPast")}</h3>
                {groupedBookings.todayPast.map((booking) => (
                  <Card key={booking.$id} className="overflow-hidden hover:shadow-md transition-shadow opacity-75">
                    <div className="flex items-center px-6 py-4 gap-4">
                      {/* Left Section - Service Icon */}
                      <div className="w-[100px] h-[70px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={storage.getFilePreview("service_images", booking.service_resources.services.image)}
                          alt={booking.service}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col flex-grow gap-2">
                        <div className="flex items-center gap-2">
                          <GamepadIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{booking.service_resources.services.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {booking.service_resources.name}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User2 className="w-4 h-4" />
                          <span>{booking.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4" />
                          <span className="font-medium">
                            {t("bookingsPricePerHour", { price: booking.service_resources.services.price })}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Future Bookings */}
            {groupedBookings.upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t("bookingsUpcoming")}</h3>
                {groupedBookings.upcoming.map((booking) => (
                  <Card key={booking.$id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center px-6 py-4 gap-4">
                      {/* Left Section - Service Icon */}
                      <div className="w-[100px] h-[70px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={storage.getFilePreview("service_images", booking.service_resources.services.image)}
                          alt={booking.service}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col flex-grow gap-2">
                        <div className="flex items-center gap-2">
                          <GamepadIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{booking.service_resources.services.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {booking.service_resources.name}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User2 className="w-4 h-4" />
                          <span>{booking.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4" />
                          <span className="font-medium">
                            {t("bookingsPricePerHour", { price: booking.service_resources.services.price })}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Past Bookings */}
            {groupedBookings.past.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-muted-foreground">{t("bookingsPast")}</h3>
                {groupedBookings.past.map((booking) => (
                  <Card key={booking.$id} className="overflow-hidden hover:shadow-md transition-shadow opacity-75">
                    <div className="flex items-center px-6 py-4 gap-4">
                      {/* Left Section - Service Icon */}
                      <div className="w-[100px] h-[70px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={storage.getFilePreview("service_images", booking.service_resources.services.image)}
                          alt={booking.service}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col flex-grow gap-2">
                        <div className="flex items-center gap-2">
                          <GamepadIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{booking.service_resources.services.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {booking.service_resources.name}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User2 className="w-4 h-4" />
                          <span>{booking.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4" />
                          <span className="font-medium">
                            {t("bookingsPricePerHour", { price: booking.service_resources.services.price })}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        )}
        {!isLoading && bookings.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("bookingsNoBookings")}
          </p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("bookingsPaginationShowing", { start: 1, end: 3, total: 12 })}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              {t("bookingsPaginationPrevious")}
            </Button>
            <Button variant="outline" size="sm">
              {t("bookingsPaginationNext")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select defaultValue="10">
            <SelectTrigger className="w-[70px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
