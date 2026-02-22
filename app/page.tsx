'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '60px' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '48px',
          fontWeight: 800,
          marginBottom: '20px',
          lineHeight: 1.2
        }}>
          Recommandez <span style={{ color: '#5B6EF5' }}>Marpeap</span>.
          <br />
          Touchez une commission.
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#a0a0a0',
          maxWidth: '600px'
        }}>
          Devenez apporteur d'affaires et gagnez des commissions sur chaque vente que vous apportez.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '40px',
        marginBottom: '80px',
        flexWrap: 'wrap',
        justifyContent: 'center'
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

        <div style={{ color: '#5B6EF5', fontSize: '24px', display: 'flex', alignItems: 'center' }}>→</div>

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

        <div style={{ color: '#5B6EF5', fontSize: '24px', display: 'flex', alignItems: 'center' }}>→</div>

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
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Link
          href="/register"
          style={{
            padding: '16px 32px',
            backgroundColor: '#5B6EF5',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '16px',
            transition: 'opacity 0.2s'
          }}
        >
          Devenir apporteur
        </Link>
        <Link
          href="/login"
          style={{
            padding: '16px 32px',
            backgroundColor: 'transparent',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '16px',
            border: '2px solid #5B6EF5'
          }}
        >
          Se connecter
        </Link>
      </div>
    </main>
  )
}
