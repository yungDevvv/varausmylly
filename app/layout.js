import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/user-context";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Varausmylly",
  description: "Booking system",
};

export default async function RootLayout({ children }) {
  if (module.hot) {
    module.hot.decline();
  }

  const messages = await getMessages();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <UserProvider>
            {children}
          </UserProvider>
        </NextIntlClientProvider>

      </body>
    </html>
  );
}
