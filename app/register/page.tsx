'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.full_name.trim()) e.full_name = 'Requis'
    if (!formData.email.trim()) e.email = 'Requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide'
    if (!formData.phone.trim()) e.phone = 'Requis'
    if (!formData.password) e.password = 'Requis'
    else if (formData.password.length < 8) e.password = 'Minimum 8 caractères'
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Mots de passe différents'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referred_by_code: refCode || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setFormData({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' })
      } else {
        setErrors({ submit: data.error || 'Une erreur est survenue' })
      }
    } catch {
      setErrors({ submit: 'Une erreur est survenue' })
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'full_name', label: 'Nom complet', type: 'text', placeholder: 'Jean Dupont' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'jean@exemple.fr' },
    { key: 'phone', label: 'Téléphone', type: 'tel', placeholder: '06 12 34 56 78' },
    { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '8 caractères minimum' },
    { key: 'confirmPassword', label: 'Confirmation', type: 'password', placeholder: 'Confirmez votre mot de passe' },
  ]

  return (
    <main className="min-h-screen bg-bg-base font-body flex items-center justify-center px-4 py-8">
      {/* Background halos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-1/4 right-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(54,216,176,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 -left-[10%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[460px]">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="font-display text-xl font-bold text-text-primary tracking-tight">
            marpeap
          </Link>
        </div>

        {refCode && (
          <div className="bg-accent-mint/8 border border-accent-mint/20 rounded-xl px-4 py-2.5 mb-4 text-center">
            <span className="font-body text-text-secondary text-xs">
              Invité par le code partenaire <strong className="text-accent-mint">{refCode}</strong>
            </span>
          </div>
        )}

        {message ? (
          <div className="card p-8 md:p-10 text-center">
            <div className="w-12 h-12 bg-accent-mint/10 border border-accent-mint/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
                <path d="M4 9l3.5 3.5L14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-display text-lg text-text-primary font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
              Demande envoyée
            </h2>
            <p className="font-body text-text-secondary text-sm leading-relaxed mb-6">{message}</p>
            <Link href="/login" className="btn-primary py-2.5 px-6 text-sm">
              Se connecter
            </Link>
          </div>
        ) : (
          <div className="card p-8 md:p-9">
            <h1 className="font-display text-xl text-text-primary text-center mb-1.5 font-semibold" style={{ letterSpacing: '-0.015em' }}>
              Devenir apporteur
            </h1>
            <p className="font-body text-text-muted text-sm text-center mb-7 leading-relaxed">
              Rejoignez le programme et gagnez des commissions sur chaque vente.
            </p>

            {errors.submit && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3 mb-5 text-sm text-accent-red text-center font-body">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {fields.map(field => (
                <div key={field.key}>
                  <label className={`label ${errors[field.key] ? 'text-accent-red' : ''}`}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className={`input ${errors[field.key] ? 'border-accent-red/30 bg-accent-red/5' : ''}`}
                  />
                  {errors[field.key] && (
                    <span className="text-xs text-accent-red mt-1 block font-body">{errors[field.key]}</span>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className={`btn-primary py-2.5 justify-center text-sm mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Inscription...' : 'Soumettre ma demande'}
              </button>
            </form>

            <p className="text-center mt-5 text-text-muted text-sm font-body">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-accent-mint hover:text-accent-mint-dim transition-colors font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function Register() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
