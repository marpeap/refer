'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMobile } from '@/hooks/useMobile'

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const isMobile = useMobile()

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) newErrors.full_name = 'Le nom complet est requis'
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis'
    if (!formData.password) newErrors.password = 'Le mot de passe est requis'
    else if (formData.password.length < 8) newErrors.password = 'Le mot de passe doit faire au moins 8 caractères'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
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
          password: formData.password
        })
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

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '12px 14px' : '14px 16px',
    backgroundColor: '#111118',
    border: '1px solid #2a2a35',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: isMobile ? '16px' : '16px',
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
      padding: isMobile ? '20px 16px' : '40px 20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '420px'
      }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: isMobile ? '28px' : '32px',
          fontWeight: 800,
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Inscription
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#a0a0a0',
          marginBottom: '32px',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          Devenez apporteur d&apos;affaires
        </p>

        {message && (
          <div style={{
            padding: '16px',
            backgroundColor: '#1a3a1a',
            border: '1px solid #2a5a2a',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            {message}
          </div>
        )}

        {errors.submit && (
          <div style={{
            padding: '16px',
            backgroundColor: '#3a1a1a',
            border: '1px solid #5a2a2a',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
            color: '#ff6b6b',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nom complet</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.full_name ? '#ff6b6b' : '#2a2a35' }}
              placeholder="Jean Dupont"
            />
            {errors.full_name && <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.full_name}</span>}
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.email ? '#ff6b6b' : '#2a2a35' }}
              placeholder="jean@exemple.fr"
            />
            {errors.email && <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div>
            <label style={labelStyle}>Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.phone ? '#ff6b6b' : '#2a2a35' }}
              placeholder="06 12 34 56 78"
            />
            {errors.phone && <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.password ? '#ff6b6b' : '#2a2a35' }}
              placeholder="8 caractères minimum"
            />
            {errors.password && <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
          </div>

          <div>
            <label style={labelStyle}>Confirmation mot de passe</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={{ ...inputStyle, borderColor: errors.confirmPassword ? '#ff6b6b' : '#2a2a35' }}
              placeholder="Confirmez votre mot de passe"
            />
            {errors.confirmPassword && <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: isMobile ? '14px' : '16px',
              backgroundColor: '#5B6EF5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '16px' : '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '12px'
            }}
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#a0a0a0',
          fontSize: isMobile ? '14px' : '14px'
        }}>
          Déjà inscrit ?{' '}
          <Link href="/login" style={{ color: '#5B6EF5', textDecoration: 'none', fontWeight: 500 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
