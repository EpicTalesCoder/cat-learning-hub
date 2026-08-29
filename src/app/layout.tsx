import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Cat Learning Hub — Học cùng cộng đồng',
  description:
    'Nền tảng học tập cộng đồng. Tạo phòng học, mời bạn bè, cùng nhau tập trung.',
  keywords: ['học tập', 'study room', 'focus', 'cộng đồng học tập'],
  openGraph: {
    title: 'Cat Learning Hub',
    description: 'Học cùng cộng đồng — tập trung hơn, hiệu quả hơn.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

