import { Client, Storage } from 'appwrite';

export const client = new Client();


client
   .setEndpoint('https://appwrite.crossmedia.fi/v1')
   .setProject('varausmylly-dev');

export const storage = new Storage(client); 
