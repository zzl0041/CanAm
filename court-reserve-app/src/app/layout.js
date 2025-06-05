import './globals.css'
import Image from 'next/image'

export const metadata = {
  title: 'CanAm Court Reservation',
  description: 'Badminton court reservation system for CanAm',
  icons: [
    { rel: 'icon', url: '/CanAm.png' },
    { rel: 'shortcut icon', url: '/CanAm.png' },
    { rel: 'apple-touch-icon', url: '/CanAm.png' }
  ]
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/CanAm.png"
                alt="CanAm Logo"
                width={70}
                height={70}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold">
                CanAm Badminton Court Reservation System
              </h1>
              <Image
                src="/qrcodeph.com_1748884377974.png"
                alt="Reservation System QR Code"
                width={70}
                height={70}
                className="ml-4"
              />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
