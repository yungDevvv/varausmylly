// src/lib/server/appwrite.js
"use server";

import { Client, Account, ID, Databases, Query, Storage } from "node-appwrite";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";


const VISIBILITY_TYPES = {
    EVERYONE: 'everyone',
    HIDDEN: 'hidden'
};

export async function createAdminClient() {

    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_PROJECT)
        .setKey(process.env.NEXT_PUBLIC_APPWRITE_SESSION_KEY);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}

export async function createSessionClient() {

    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_PROJECT);

    let session = await cookies();

    session = session.get("appwrite-session");

    if (!session) {
        console.log("NO SESSION, createSessionClient()");
        return redirect("/login");
    }

    client.setSession(session.value);

    return {
        get account() {
            return new Account(client);
        },
        get storage() {
            return new Storage(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}


export async function signInWithEmail(email, password) {

    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();

    if (cookieStore) {
        cookieStore.set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });
    }

}

export async function getLoggedInUser() {
    const { account } = await createSessionClient();
     

    const {$id} = await account.get();


    const user = await getDocument("main_db", "users", $id)
    return user;
}

export async function getDocument(db_id, collection_id, document_id, query) {
    try {
        const { databases } = await createAdminClient();

        const response = await databases.getDocument(
            db_id,
            collection_id,
            document_id,
        );

        return response;
    } catch (error) {
        console.log('ERROR getDocument():', error);
        // throw error;
    }
}

export async function updateDocument(db_id, collection_id, document_id, values) {
    try {
        const { databases } = await createAdminClient();

        const response = await databases.updateDocument(
            db_id,
            collection_id,
            document_id,
            values
        );

        return response;
    } catch (error) {
        console.log('Error updating profile:', error);
        throw error;
    }
}

export async function createDocument(db_id, collection_id, { document_id, body }) {

    try {
        const { databases } = await createAdminClient();

        const response = await databases.createDocument(
            db_id,
            collection_id,
            document_id || ID.unique(),
            {
                ...body
            }
        );

        return response;
    } catch (error) {
        console.log('Error updating profile:', error);
        throw error;
    }
}

export async function listDocuments(db_id, collection_id, query) {
    const queryArray = [];

    let hasOrder = false;
    if (query) {
        query.forEach(element => {
            if (element.type === 'equal') {
                queryArray.push(Query.equal(element.name, element.value));
            }
            if (element.type === 'limit') {
                queryArray.push(Query.limit(element.value));
            }
            if (element.type === 'order') { 
                hasOrder = true;
                if (element.value === 'asc') {
                    queryArray.push(Query.orderAsc(element.name));
                } else {
                    queryArray.push(Query.orderDesc(element.name));
                }
            }
            if (element.type === 'select') {
                queryArray.push(Query.select(element.value));
            }
        });
    }

    const { databases } = await createAdminClient();

    const response = await databases.listDocuments(
        db_id,
        collection_id,
        hasOrder ? [...queryArray] : [Query.orderDesc("$createdAt"), ...queryArray]
    );

    return response;
}

export async function deleteDocument(db_id, collection_id, document_id) {

    try {
        const { databases } = await createAdminClient();

        const response = await databases.deleteDocument(
            db_id,
            collection_id,
            document_id
        );

        return response;
    } catch (error) {
        console.log('Error delete document:', error);
        throw error;
    }
}

export async function createFile(bucket_id, file) {
    const { storage } = await createSessionClient();
    // const storage = new Storage(client);

    try {
        const response = await storage.createFile(bucket_id, ID.unique(), file);

        if (response) return response.$id

        return null;
    } catch (error) {
        console.log('Error create file:', error);
        throw error;
    }

}

