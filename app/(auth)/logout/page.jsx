import { createSessionClient } from "@/lib/appwrite/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    try {
        const { account } = await createSessionClient();
        await account.deleteSession("current");
        const cookiesStore = await cookies();
        cookiesStore.set("appwrite_session", "", { expires: new Date(0) });
        return redirect("/")
    } catch (error) {
        console.log(error)
        return "Internal Server Error 500"
    }
}
