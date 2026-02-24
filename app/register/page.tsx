'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Register() {
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
        body: JSON.stringify({ full_name: formData.full_name, email: formData.email, phone: formData.phone, password: formData.password }),
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

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    background: hasError ? 'rgba(231,76,60,0.07)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: 9,
    color: '#fff',
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  })

  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: rgba(91,110,245,0.6) !important; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(91,110,245,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(155,91,245,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#fff' }}>
              mar<span style={{ color: '#5B6EF5' }}>peap</span>
            </span>
          </Link>
        </div>

        {message ? (
          <div style={{ background: 'rgba(46,213,115,0.08)', border: '1px solid rgba(46,213,115,0.2)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Demande envoyée !</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
            <Link href="/login" style={{ display: 'inline-block', padding: '11px 24px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14 }}>
              Se connecter
            </Link>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>Devenir apporteur</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
              Rejoignez le programme et gagnez des commissions sur chaque vente.
            </div>

            {errors.submit && (
              <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#ff6b6b', textAlign: 'center' }}>
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'full_name', label: 'Nom complet', type: 'text', placeholder: 'Jean Dupont' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'jean@exemple.fr' },
                { key: 'phone', label: 'Téléphone', type: 'tel', placeholder: '06 12 34 56 78' },
                { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '8 caractères minimum' },
                { key: 'confirmPassword', label: 'Confirmation', type: 'password', placeholder: 'Confirmez votre mot de passe' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: errors[field.key] ? '#ff6b6b' : 'rgba(255,255,255,0.5)', marginBottom: 7 }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={inputStyle(!!errors[field.key])}
                  />
                  {errors[field.key] && <span style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4, display: 'block' }}>{errors[field.key]}</span>}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                style={{ padding: '13px', background: loading ? 'rgba(91,110,245,0.5)' : '#5B6EF5', border: 'none', borderRadius: 9, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}
              >
                {loading ? 'Inscription...' : 'Soumettre ma demande'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Déjà inscrit ?{' '}
              <Link href="/login" style={{ color: '#5B6EF5', textDecoration: 'none', fontWeight: 600 }}>Se connecter</Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
