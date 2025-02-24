import { Inter } from 'next/font/google'
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import { ModalProvider } from '@/components/providers/modal-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ModalProvider />
      <Toaster />
    </div>
  )
}
