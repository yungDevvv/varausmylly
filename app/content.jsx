"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Euro, MapPin, Phone, Users } from "lucide-react"
import { BookingClientModal } from "@/components/modals/client/client-booking-modal"
import { storage } from "@/lib/appwrite/client"
import { toast } from "@/hooks/use-toast"


export default function Content({ services }) {
    const [selectedService, setSelectedService] = useState(null)

    // Convert minutes to hours with format
    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes}min`
        }
        const hours = minutes / 60
        return `${hours}h`;
    }


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div
                className="relative bg-primary min-h-[400px] flex items-center"
                style={{
                    backgroundImage: "url('/banner-appointment.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Book Your Perfect Game Time
                        </h1>
                        <p className="mt-6 text-lg text-gray-300">
                            Experience the thrill of pool and bowling in our modern facilities.
                            Book your slot now and enjoy quality time with friends and family.
                        </p>
                    </div>
                </div>
            </div>

            {/* Booking Section */}
            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Services List */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-6">Available Services</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {services.filter(service => service.isActive).map((service) => (
                            <Card key={service.$id} className="overflow-hidden">
                                <div className="aspect-video relative">
                                    <img
                                        src={storage.getFilePreview("service_images", service.image)}
                                        alt={service.name}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold">{service.name}</h3>
                                    <p className="my-4 text-muted-foreground leading-5">{service.description}</p>
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                {formatDuration(service.slotSteps)} - {service.maxDuration}h
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                Up to {service.maxPlayers} players
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">{service.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Euro className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">{service.price}€/h</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="mt-4 w-full"
                                        onClick={() => setSelectedService(service)}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {selectedService && (
                    <BookingClientModal
                        isOpen={!!selectedService}
                        onClose={() => setSelectedService(null)}
                        service={selectedService}
                        tracks={selectedService.service_resources || []}
                        onSubmit={() => {
                            // Handle booking submission
                            console.log("Booking submitted")
                            toast.success("Booking successful!")
                        }}
                    />
                )}
            </div>

            {/* Contact Section */}
            <div className="bg-black text-white">
                <div className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <h3 className="text-lg font-semibold">Contact Us</h3>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4" />
                                    <span>+1 234 567 890</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    <span>123 Game Street, City, Country</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Opening Hours</h3>
                            <div className="mt-4 space-y-2">
                                <p>Monday - Friday: 9:00 AM - 10:00 PM</p>
                                <p>Saturday - Sunday: 10:00 AM - 11:00 PM</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Follow Us</h3>
                            <div className="mt-4 space-x-4">
                                <Button variant="ghost" className="text-white hover:text-white/80">
                                    Facebook
                                </Button>
                                <Button variant="ghost" className="text-white hover:text-white/80">
                                    Instagram
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
