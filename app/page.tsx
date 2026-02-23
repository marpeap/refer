'use client'

import Link from 'next/link'
import { useMobile } from '@/hooks/useMobile'

export default function Home() {
  const isMobile = useMobile()

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '20px 16px' : '40px 20px',
      textAlign: 'center',
      position: 'relative'
    }}>
      {/* Admin button */}
      <Link 
        href="/admin"
        style={{
          position: 'absolute',
          bottom: isMobile ? '20px' : '40px',
          right: isMobile ? '20px' : '40px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#666',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #333',
          transition: 'all 0.2s',
          opacity: 0.7
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.color = '#5B6EF5'
          e.currentTarget.style.borderColor = '#5B6EF5'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7'
          e.currentTarget.style.color = '#666'
          e.currentTarget.style.borderColor = '#333'
        }}
      >
        Admin
      </Link>

      <div style={{ marginBottom: isMobile ? '40px' : '60px' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: isMobile ? '32px' : '48px',
          fontWeight: 800,
          marginBottom: '20px',
          lineHeight: 1.2
        }}>
          Recommandez <span style={{ color: '#5B6EF5' }}>Marpeap</span>.
          <br />
          Touchez une commission.
        </h1>
        <p style={{
          fontSize: isMobile ? '16px' : '18px',
          color: '#a0a0a0',
          maxWidth: '600px'
        }}>
          Devenez apporteur d'affaires et gagnez des commissions sur chaque vente que vous apportez.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: isMobile ? '24px' : '40px',
        marginBottom: isMobile ? '40px' : '80px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#5B6EF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700
          }}>1</div>
          <span style={{ fontWeight: 500 }}>Inscrivez-vous</span>
        </div>

        {!isMobile && <div style={{ color: '#5B6EF5', fontSize: '24px', display: 'flex', alignItems: 'center' }}>→</div>}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#5B6EF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700
          }}>2</div>
          <span style={{ fontWeight: 500 }}>Nous vous contactons</span>
        </div>

        {!isMobile && <div style={{ color: '#5B6EF5', fontSize: '24px', display: 'flex', alignItems: 'center' }}>→</div>}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#5B6EF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700
          }}>3</div>
          <span style={{ fontWeight: 500 }}>Suivez vos gains</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: isMobile ? '16px' : '20px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        maxWidth: isMobile ? '300px' : 'none'
      }}>
        <Link
          href="/register"
          style={{
            padding: isMobile ? '14px 24px' : '16px 32px',
            backgroundColor: '#5B6EF5',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '16px',
            transition: 'opacity 0.2s',
            textAlign: 'center',
            display: 'block'
          }}
        >
          Devenir apporteur
        </Link>
        <Link
          href="/login"
          style={{
            padding: isMobile ? '14px 24px' : '16px 32px',
            backgroundColor: 'transparent',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '16px',
            border: '2px solid #5B6EF5',
            textAlign: 'center',
            display: 'block'
          }}
        >
          Se connecter
        </Link>
      </div>
    </main>
  )
}
