'use client'

import React, { useState } from 'react'

const AfterLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Redirect to Google OAuth
      window.location.href = '/admin/oauth/authorization/google'
    } catch (err) {
      setError('Failed to initiate Google sign-in. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCreateAccount = () => {
    // Redirect to admin - Payload will automatically show first user creation if no users exist
    window.location.href = '/admin'
  }

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #fcc',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Divider */}
      <div style={{
        borderTop: '1px solid #e0e0e0',
        paddingTop: '20px',
        marginBottom: '16px',
        position: 'relative'
      }}>
        <span style={{
          backgroundColor: 'white',
          padding: '0 10px',
          color: '#666',
          fontSize: '14px',
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          OR
        </span>
      </div>

      {/* Google OAuth Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#4285f4',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '0 auto 20px auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s',
          minWidth: '200px',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#357ae8'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#4285f4'
          }
        }}
      >
        {isLoading ? (
          <span>Connecting...</span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>

      {/* Registration Section */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 12px 0' }}>
          Need to create an admin account?
        </p>
        <button
          onClick={handleCreateAccount}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#218838'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#28a745'
          }}
        >
          Create First Admin Account
        </button>
        <p style={{ color: '#999', fontSize: '12px', margin: '8px 0 0 0' }}>
          This will redirect you to the registration page
        </p>
      </div>
    </div>
  )
}

export default AfterLogin