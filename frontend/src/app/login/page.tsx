export default function LoginPage() {
  const error =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('error');

  return (
    <div>
      <h1>Admin Login</h1>

      <form
        action="/api/login"
        method="POST"
        style={{ display: 'grid', gap: 8, maxWidth: 360 }}
      >
        <input name="username" placeholder="Username" defaultValue="admin" />
        <input
          name="password"
          type="password"
          placeholder="Password"
          defaultValue="password123"
        />
        <button type="submit">Login</button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: 8 }}>Invalid credentials</div>
      )}

      <form action="/api/logout" method="POST" style={{ marginTop: 12 }}>
        <button type="submit">Logout</button>
      </form>
    </div>
  );
}
