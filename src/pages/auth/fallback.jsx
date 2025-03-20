export default function FallbackAuthPage() {
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '400px', 
      margin: '0 auto', 
      textAlign: 'center' 
    }}>
      <h1 style={{ marginBottom: '1rem' }}>Authentication</h1>
      <p>Please sign in to continue.</p>
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/api/auth/login"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#4F46E5',
            color: 'white',
            borderRadius: '0.25rem',
            textDecoration: 'none'
          }}
        >
          Sign In
        </a>
      </div>
    </div>
  )
} 