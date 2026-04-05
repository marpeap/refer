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
    <main className="min-h-screen bg-bg-base font-body flex items-center justify-center px-4 py-8">
      {/* Background halos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-1/4 right-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(54,216,176,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-xl font-bold text-text-primary tracking-tight">
            marpeap
          </Link>
        </div>

        {/* Card */}
        <div className="card p-8 md:p-9">
          <h1 className="font-display text-xl text-text-primary text-center mb-1.5 font-semibold" style={{ letterSpacing: '-0.015em' }}>
            Connexion
          </h1>
          <p className="font-body text-text-muted text-sm text-center mb-7">
            Accédez à votre espace apporteur
          </p>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3 mb-5 text-sm text-accent-red text-center font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@exemple.fr"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Votre mot de passe"
                required
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary py-2.5 justify-center text-sm mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center mt-5 text-text-muted text-sm font-body">
            Pas encore inscrit ?{' '}
            <Link href="/register" className="text-accent-mint hover:text-accent-mint-dim transition-colors font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
