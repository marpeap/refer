'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Sale {
  id: string
  client_name: string
  service: string
  amount: number
  admin_note: string | null
  created_at: string
}

interface User {
  full_name: string
  email: string
  phone: string
  code: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('refer_token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const [userRes, salesRes] = await Promise.all([
          fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } })
        ])

        if (!userRes.ok || !salesRes.ok) {
          localStorage.removeItem('refer_token')
          router.push('/login')
          return
        }

        const userData = await userRes.json()
        const salesData = await salesRes.json()

        setUser(userData)
        setSales(salesData)
      } catch {
        localStorage.removeItem('refer_token')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('refer_token')
    router.push('/login')
  }

  const copyCode = () => {
    if (user?.code) {
      navigator.clipboard.writeText(user.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#a0a0a0' }}>Chargement...</div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main style={{ minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '24px',
        borderBottom: '1px solid #2a2a35',
        marginBottom: '32px'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '24px',
            fontWeight: 800,
            color: '#ffffff'
          }}>
            mar<span style={{ color: '#5B6EF5' }}>peap</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#a0a0a0' }}>{user.full_name}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #5B6EF5',
              borderRadius: '6px',
              color: '#5B6EF5',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Code Section */}
      <section style={{
        backgroundColor: '#111118',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '16px',
          color: '#a0a0a0'
        }}>
          Mon code apporteur
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '48px',
            fontWeight: 800,
            color: '#5B6EF5',
            letterSpacing: '2px'
          }}>
            {user.code}
          </span>
          <button
            onClick={copyCode}
            style={{
              padding: '10px 20px',
              backgroundColor: copied ? '#1a3a1a' : '#5B6EF5',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </section>

      {/* Sales Table */}
      <section>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          Mes ventes
        </h2>

        {sales.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#a0a0a0',
            backgroundColor: '#111118',
            borderRadius: '12px'
          }}>
            Aucune vente enregistrée pour le moment.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#111118',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#1a1a25' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Client</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Service</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontWeight: 500, color: '#a0a0a0' }}>Montant</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} style={{ borderTop: '1px solid #2a2a35' }}>
                    <td style={{ padding: '16px' }}>{sale.client_name}</td>
                    <td style={{ padding: '16px' }}>{sale.service}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>
                      {sale.amount.toLocaleString('fr-FR')} €
                    </td>
                    <td style={{ padding: '16px', color: '#a0a0a0' }}>{formatDate(sale.created_at)}</td>
                    <td style={{ padding: '16px', color: '#a0a0a0' }}>{sale.admin_note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
