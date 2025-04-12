import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CanAm Badminton Court Reservation',
  description: 'Book your badminton court at CanAm',
  icons: [
    { rel: 'icon', url: '/CanAm.png' },
    { rel: 'shortcut icon', url: '/CanAm.png' },
    { rel: 'apple-touch-icon', url: '/CanAm.png' }
  ]
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/CanAm.png" />
        <link rel="shortcut icon" href="/CanAm.png" />
      </head>
      <body className={inter.className}>
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold text-center">CanAm Badminton Court Reservation System</h1>
        </header>
        {children}
      </body>
    </html>
  )
}
