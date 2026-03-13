'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VenteSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<string>('pending')
  const [isReferrer, setIsReferrer] = useState(false)

  const isEnabled = process.env.NEXT_PUBLIC_VENTE_ENABLED === 'true'

  useEffect(() => {
    if (!isEnabled || !sessionId) return

    const token = localStorage.getItem('refer_token')
    if (!token) {
      // Prospect (no referrer account) — show immediate thank-you
      setStatus('prospect')
      return
    }
    setIsReferrer(true)

    let attempts = 0
    const maxAttempts = 15 // 15 x 2s = 30s

    const poll = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/sales/status?session_id=${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'confirmed') {
            setStatus('confirmed')
            clearInterval(poll)
          } else if (data.status === 'expired' || data.status === 'failed' || data.status === 'cancelled') {
            setStatus(data.status)
            clearInterval(poll)
          }
        }
      } catch {
        // retry silently
      }

      if (attempts >= maxAttempts) {
        setStatus('timeout')
        clearInterval(poll)
      }
    }, 2000)

    return () => clearInterval(poll)
  }, [sessionId, isEnabled])

  if (!isEnabled) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
        <p>Cette fonctionnalite n'est pas encore disponible.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 480, textAlign: 'center', padding: 32 }}>
        {status === 'prospect' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9989;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#2ED573' }}>Merci pour votre paiement !</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>Votre paiement a bien ete pris en compte. Vous recevrez un email de confirmation sous peu.</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Vous pouvez fermer cette page.</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#8987;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Paiement en cours de confirmation...</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Nous attendons la confirmation de Stripe. Cela prend generalement quelques secondes.</p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9989;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#2ED573' }}>Vente confirmée !</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>Le paiement a été reçu. Votre commission a été enregistrée.</p>
            <Link
              href="/dashboard"
              style={{ display: 'inline-block', padding: '12px 28px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}
            >
              Retour au tableau de bord
            </Link>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9203;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Confirmation en attente</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>La confirmation prend plus de temps que prevu. Si le client a bien paye, votre vente apparaitra automatiquement dans votre tableau de bord.</p>
            <Link
              href="/dashboard"
              style={{ display: 'inline-block', padding: '12px 28px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}
            >
              Retour au tableau de bord
            </Link>
          </>
        )}

        {(status === 'expired' || status === 'failed' || status === 'cancelled') && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10060;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#FF4757' }}>Paiement non abouti</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>Le paiement a expire ou a ete annule. Vous pouvez relancer une nouvelle vente depuis votre tableau de bord.</p>
            <Link
              href="/dashboard"
              style={{ display: 'inline-block', padding: '12px 28px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}
            >
              Retour au tableau de bord
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
