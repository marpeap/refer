'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
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
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('refer_token', data.token)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Identifiants incorrects')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: rgba(91,110,245,0.6) !important; }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(91,110,245,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#fff' }}>
              mar<span style={{ color: '#5B6EF5' }}>peap</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>Connexion</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>Accédez à votre espace apporteur</div>

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#ff6b6b', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 7 }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@exemple.fr"
                required
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, color: '#fff', fontSize: 15, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 7 }}>Mot de passe</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Votre mot de passe"
                required
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, color: '#fff', fontSize: 15, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '13px', background: loading ? 'rgba(91,110,245,0.5)' : '#5B6EF5', border: 'none', borderRadius: 9, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.2s' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            Pas encore inscrit ?{' '}
            <Link href="/register" style={{ color: '#5B6EF5', textDecoration: 'none', fontWeight: 600 }}>Créer un compte</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
