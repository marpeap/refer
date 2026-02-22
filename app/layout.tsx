export const metadata = {
  title: 'Marpeap - Programme d\'apporteurs d\'affaires',
  description: 'Recommandez Marpeap. Touchez une commission.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: '#080810', 
        color: '#ffffff',
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  )
}
