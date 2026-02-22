'use client'

import { useState, useEffect, useRef } from 'react'
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

interface Contract {
  id: string
  pdf_filename: string
  status: 'sent' | 'signed'
  otp_sent_at: string
  signed_at: string | null
  pdf_url: string
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
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [signatureImage, setSignatureImage] = useState('')
  const [signLoading, setSignLoading] = useState(false)
  const [signSuccess, setSignSuccess] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('refer_token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const [userRes, salesRes, contractRes] = await Promise.all([
          fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/contracts/me', { headers: { Authorization: `Bearer ${token}` } })
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

        if (contractRes.ok) {
          const contractData = await contractRes.json()
          setContract(contractData.contract)
        }
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

  // Canvas drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    const { x, y } = getCanvasCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    const { x, y } = getCanvasCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureImage(canvas.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSignatureImage('')
  }

  const signContract = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Veuillez entrer le code OTP à 6 chiffres')
      return
    }
    if (!signatureImage) {
      alert('Veuillez signer le contrat')
      return
    }

    const token = localStorage.getItem('refer_token')
    if (!token) return

    setSignLoading(true)
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otp_code: otpCode,
          signature_image: signatureImage
        })
      })

      if (res.ok) {
        setSignSuccess(true)
        // Refresh contract data
        const contractRes = await fetch('/api/contracts/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (contractRes.ok) {
          const contractData = await contractRes.json()
          setContract(contractData.contract)
        }
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la signature')
      }
    } catch {
      alert('Erreur lors de la signature')
    } finally {
      setSignLoading(false)
    }
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

      {/* Contract Section */}
      {contract && (
        <section style={{
          backgroundColor: '#111118',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          {contract.status === 'sent' && !signSuccess && (
            <>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📄 Contrat à signer
              </h2>
              
              <a
                href={contract.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#5B6EF5',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  fontWeight: 500
                }}
              >
                Voir le contrat
              </a>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#a0a0a0'
                }}>
                  Signature manuscrite
                </label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'crosshair',
                    display: 'block'
                  }}
                />
                <button
                  onClick={clearSignature}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #a0a0a0',
                    borderRadius: '6px',
                    color: '#a0a0a0',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Effacer
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#a0a0a0'
                }}>
                  Code reçu par email (6 chiffres)
                </label>
                <input
                  type="number"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                  placeholder="123456"
                  style={{
                    width: '200px',
                    padding: '12px 16px',
                    backgroundColor: '#080810',
                    border: '1px solid #2a2a35',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '16px',
                    letterSpacing: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={signContract}
                disabled={signLoading}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: signLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 700,
                  opacity: signLoading ? 0.7 : 1
                }}
              >
                {signLoading ? 'Signature en cours...' : 'Signer le contrat'}
              </button>
            </>
          )}

          {(contract.status === 'signed' || signSuccess) && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#10b981',
                  margin: 0
                }}>
                  Contrat signé le {formatDate(contract.signed_at || new Date().toISOString())}
                </h2>
              </div>
              <a
                href={contract.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#5B6EF5',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                Télécharger mon contrat
              </a>
            </>
          )}
        </section>
      )}

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
