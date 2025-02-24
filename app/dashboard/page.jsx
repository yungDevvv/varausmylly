"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";

export default function DashboardPage() {
  // Example bookings data (will be replaced with real data from Appwrite)
  const bookings = [
    {
      id: 1,
      service: 'Pool Table',
      image: '/biljard.jpg',
      customer: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1 234 567 890'
      },
      date: 'February 4, 2025',
      time: '21:00 - 23:00',
      status: 'active',
      price: 100
    },
    {
      id: 2,
      service: 'Bowling Lane',
      image: '/bowling.jpg',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1 234 567 891'
      },
      date: 'February 4, 2025',
      time: '22:00 - 24:00',
      status: 'upcoming',
      price: 150
    },
    {
      id: 3,
      service: 'Pool Table',
      image: '/biljard.jpg',
      customer: {
        name: 'Mike Wilson',
        email: 'mike@example.com',
        phone: '+1 234 567 892'
      },
      date: 'February 5, 2025',
      time: '14:00 - 16:00',
      status: 'upcoming',
      price: 100
    },
    {
      id: 4,
      service: 'Pool Table',
      image: '/biljard.jpg',
      customer: {
        name: 'Alex Brown',
        email: 'alex@example.com',
        phone: '+1 234 567 893'
      },
      date: 'February 4, 2025',
      time: '14:00 - 16:00',
      status: 'completed',
      price: 100
    },
    {
      id: 5,
      service: 'Bowling Lane',
      image: '/bowling.jpg',
      customer: {
        name: 'Emma Davis',
        email: 'emma@example.com',
        phone: '+1 234 567 894'
      },
      date: 'February 4, 2025',
      time: '16:00 - 18:00',
      status: 'completed',
      price: 150
    }
  ]

  const activeBookings = bookings.filter(booking => booking.status === 'active')
  const upcomingBookings = bookings.filter(booking => booking.status === 'upcoming')
  const completedTodayBookings = bookings.filter(booking => 
    booking.status === 'completed' && 
    booking.date === 'February 4, 2025'
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your booking management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Active Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBookings.length === 0 ? (
                <p className="text-muted-foreground">No active bookings at the moment</p>
              ) : (
                activeBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={booking.image}
                          alt={booking.service}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{booking.service}</h3>
                        <p className="text-sm text-muted-foreground">{booking.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.time}</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <p className="text-muted-foreground">No upcoming bookings for today</p>
              ) : (
                upcomingBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={booking.image}
                          alt={booking.service}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{booking.service}</h3>
                        <p className="text-sm text-muted-foreground">{booking.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.time}</p>
                      </div>
                    </div>
                    <Badge>Upcoming</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedTodayBookings.length === 0 ? (
              <p className="text-muted-foreground">No completed bookings for today</p>
            ) : (
              completedTodayBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                      <Image
                        src={booking.image}
                        alt={booking.service}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{booking.service}</h3>
                      <p className="text-sm text-muted-foreground">{booking.customer.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{booking.time}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
