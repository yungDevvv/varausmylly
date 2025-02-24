"use server"

import { listDocuments } from "@/lib/appwrite/server"
import ServicePageContent from "./content"
import { Client, Databases } from "node-appwrite";
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_PROJECT)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_SESSION_KEY);



export default async function Page() {
  try {
    const databases = new Databases(client);
    
    const { documents: services } = await databases.listDocuments("main_db", "services");

    return <ServicePageContent services={services} />
  } catch (error) {
    console.log(error)
    return "Internal Server Error 500"
  }
}

