
import Content from "./content"
import { createDocument } from "@/lib/appwrite/server";
import { getLoggedInUser } from "@/lib/appwrite/server";

export default async function Page() {
  try {
    const user = await getLoggedInUser();

    if (!user.user_settings) {

      const response = await createDocument("main_db", "user_settings", {
        body: { users: user.$id }
      })

      if (response) { // TODO: check with new user
        return (
          <>
            <Content settings={response} />
          </>
        )
      }
    }

    return (
      <>
        <Content settings={user.user_settings} />
      </>
    )
  } catch (error) {
    console.log(error);
    return "Internal Server Error 500"
  }
}
