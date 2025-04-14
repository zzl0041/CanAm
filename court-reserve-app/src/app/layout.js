import './globals.css'

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
            <h1 className="text-2xl font-bold text-center">
              CanAm Badminton Court Reservation System
            </h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
