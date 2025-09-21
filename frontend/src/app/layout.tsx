export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 20 }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <a href="/admin">Dashboard</a>
          <a href="/admin/faqs/new">Add FAQ</a>
          <a href="/login">Login</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
