import type { Metadata } from 'next'
import './globals.css'


export const metadata: Metadata = {
  title: 'CustardWeb - azooKey Keyboard Designer',
  description: 'Design custom keyboard layouts for azooKey with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}
