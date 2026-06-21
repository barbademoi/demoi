import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BarberMeta',
  description: 'Acompanhamento diário de metas para barbearias',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${dmSerif.variable} ${dmSans.variable}`}>
      <head>
        {/* Google Tag Manager (servidor proprio api.barbermeta.com.br) */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://api.barbermeta.com.br/eqfehwriy.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','brv04=EA1PMDwoS0QxOCUkOyY0Vw9UQFlZQwIfRAsTBQoAFBwcHRNZCwoLXxsb');`}
        </Script>
      </head>
      <body className="font-sans bg-background text-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
