import { listDocuments } from "@/lib/appwrite/server"
import Content from "./content"

export default async function Page() {
  const {documents: services} = await listDocuments("main_db", "services")

  return (
    <Content services={services} />
  )
}
