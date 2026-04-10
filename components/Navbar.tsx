'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ferme le menu mobile au clic sur un lien ancre
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: '64px',
        transition: 'background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        backgroundColor: scrolled ? 'rgba(6, 14, 18, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.03)' : 'none',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* ── Bloc marque ── */}
          <Link href="https://www.marpeap.com" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marpeap.png" alt="Marpeap" style={{ height: '34px', width: 'auto', display: 'block' }} />
          </Link>

          {/* ── Bloc orientation — masqué sur mobile ── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2rem' }}>
            <a
              href="#fonctionnement"
              className="font-body font-medium text-text-secondary hover:text-text-primary transition-colors"
              style={{ fontSize: '0.9rem', textDecoration: 'none' }}
            >
              Comment ça marche
            </a>
            <a
              href="#commissions"
              className="font-body font-medium text-text-secondary hover:text-text-primary transition-colors"
              style={{ fontSize: '0.9rem', textDecoration: 'none' }}
            >
              Commissions
            </a>
          </div>

          {/* ── Bloc action ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Link
              href="/login"
              className="font-body font-medium text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
              style={{ fontSize: '0.875rem', textDecoration: 'none' }}
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}
            >
              Devenir apporteur
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              className="md:hidden"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{
                display: 'block', width: '22px', height: '2px',
                background: 'var(--text-primary)',
                transition: 'all 0.25s ease',
                transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
              }} />
              <span style={{
                display: 'block', width: '22px', height: '2px',
                background: 'var(--text-primary)',
                transition: 'all 0.25s ease',
                opacity: menuOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block', width: '22px', height: '2px',
                background: 'var(--text-primary)',
                transition: 'all 0.25s ease',
                transform: menuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none',
              }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Panel mobile ── */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            zIndex: 49,
            background: 'rgba(6, 14, 18, 0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '1.25rem 1.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}
        >
          <a
            href="#fonctionnement"
            onClick={closeMenu}
            className="font-body font-medium text-text-secondary hover:text-text-primary transition-colors"
            style={{
              fontSize: '1.05rem',
              textDecoration: 'none',
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            Comment ça marche
          </a>
          <a
            href="#commissions"
            onClick={closeMenu}
            className="font-body font-medium text-text-secondary hover:text-text-primary transition-colors"
            style={{
              fontSize: '1.05rem',
              textDecoration: 'none',
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            Commissions
          </a>
          <Link
            href="/login"
            onClick={closeMenu}
            className="font-body font-medium text-text-secondary hover:text-text-primary transition-colors"
            style={{
              fontSize: '1.05rem',
              textDecoration: 'none',
              padding: '0.75rem 0',
            }}
          >
            Connexion
          </Link>
        </div>
      )}

      {/* Overlay derrière le panel mobile */}
      {menuOpen && (
        <div
          className="md:hidden"
          onClick={closeMenu}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 48,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}
    </>
  )
}
