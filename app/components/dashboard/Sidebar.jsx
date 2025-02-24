"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Settings,
  Store,
  Menu,
  ListTodo,
  StickyNote
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTranslations } from "next-intl"

// Navigation items for the sidebar
const navItems = [
  {
    name: 'sidebarOverview',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'sidebarServices',
    href: '/dashboard/services',
    icon: Store
  },
  {
    name: 'sidebarSchedule',
    href: '/dashboard/schedule',
    icon: Calendar
  },
  {
    name: 'sidebarBookings',
    href: '/dashboard/bookings',
    icon: BookOpen
  },
  {
    name: 'sidebarTodo',
    href: '/dashboard/todo',
    icon: ListTodo
  },
  {
    name: 'sidebarNotes',
    href: '/dashboard/notes',
    icon: StickyNote
  },
  {
    name: 'sidebarSettings',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center border-b px-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground">{t("sidebarLogoText")}</span>
          </span>
          <span>{t("sidebarTitle")}</span>
        </Link>
      </div>
      <div className="flex-1 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                  isActive ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.name)}
              </Link>
            )
          })}
        </div>
      </div>
      {/* <div className="mt-auto border-t px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 max-xl:w-56 border-r bg-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
