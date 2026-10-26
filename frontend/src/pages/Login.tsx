/**
 * pages/Login.tsx
 * High-aesthetic PIN login page for RingGuard Control Center.
 * Supports both on-screen numeric keypad and hardware keyboard input.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Delete, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/live', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyPress = (digit: string) => {
    if (pin.length < 8) {
      setError(null)
      setPin(prev => prev + digit)
    }
  }

  const handleDelete = () => {
    setError(null)
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setError(null)
    setPin('')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    try {
      setError(null)
      await login(pin)
      navigate('/live', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid PIN. Please try again.'
      if (msg.includes('401')) {
        setError('Incorrect PIN. Please try again.')
      } else if (msg.includes('429')) {
        setError('Too many attempts. Please wait 1 minute.')
      } else {
        setError(msg)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 selection:bg-[var(--accent)] selection:text-white"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #171d2b 0%, var(--bg) 70%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl border p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.05)',
          }}
        >
          {/* Subtle Top Glow Accent */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }}
          />

          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/10"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
                boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.5)',
              }}
            >
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {APP_NAME}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{APP_TAGLINE}</p>

            {USE_MOCKS && (
              <div
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mock Mode Active — Enter any PIN (e.g. 1234)</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Display Input */}
            <div>
              <label
                htmlFor="pin-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 text-center"
              >
                Enter Security PIN
              </label>

              <div className="relative">
                <input
                  id="pin-input"
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={pin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '')
                    setPin(val)
                    setError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 rounded-xl border bg-black/30 text-[var(--text-primary)] focus:outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  style={{
                    borderColor: error ? 'var(--critical)' : 'var(--border)',
                  }}
                  placeholder="••••"
                  autoFocus
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* PIN Indicator Dots */}
              <div className="flex justify-center gap-2 mt-3" aria-hidden="true">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                    style={{
                      background:
                        pin.length > idx
                          ? 'var(--accent)'
                          : 'var(--neutral-subtle)',
                      transform: pin.length > idx ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium border"
                style={{
                  background: 'var(--critical-subtle)',
                  borderColor: 'var(--critical)' + '40',
                  color: 'var(--critical)',
                }}
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isLoading}
                  className="h-12 rounded-xl text-lg font-semibold border transition-all active:scale-95 text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                  style={{
                    background: 'var(--surface-subtle)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || pin.length === 0}
                className="h-12 rounded-xl text-xs font-medium border transition-all active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--surface-subtle)',
                  borderColor: 'var(--border)',
                }}
                title="Clear input"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isLoading}
                className="h-12 rounded-xl text-lg font-semibold border transition-all active:scale-95 text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                style={{
                  background: 'var(--surface-subtle)',
                  borderColor: 'var(--border)',
                }}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="h-12 rounded-xl flex items-center justify-center border transition-all active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--surface-subtle)',
                  borderColor: 'var(--border)',
                }}
                title="Backspace"
                aria-label="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              }}
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer notice */}
          <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Authorized personnel only. Sessions expire after 12 hours.
          </div>
        </div>
      </div>
    </div>
  )
}
