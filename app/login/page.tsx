'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('refer_token', data.token)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#111118',
    border: '1px solid #2a2a35',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#a0a0a0'
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px'
      }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '32px',
          fontWeight: 800,
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Connexion
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#a0a0a0',
          marginBottom: '32px'
        }}>
          Accédez à votre espace apporteur
        </p>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#3a1a1a',
            border: '1px solid #5a2a2a',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
            color: '#ff6b6b'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              placeholder="jean@exemple.fr"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={inputStyle}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px',
              backgroundColor: '#5B6EF5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '12px'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#a0a0a0',
          fontSize: '14px'
        }}>
          Pas encore inscrit ?{' '}
          <Link href="/register" style={{ color: '#5B6EF5', textDecoration: 'none', fontWeight: 500 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  )
}
