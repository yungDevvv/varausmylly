"use server"

import { listDocuments } from "@/lib/appwrite/server"
import TabsContainer from "./components/tabs-container"

export default async function SchedulePage() {
  const { documents: services } = await listDocuments("main_db", "services")

  return (
    <div className="space-y-8">
      <TabsContainer services={services} />
    </div>
  )
}
