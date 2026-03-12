export default function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8, color: "#eef0f4" }}>Domain not found</h1>
        <p style={{ fontSize: 14, color: "#6e7a8e", marginBottom: 24 }}>The domain you entered doesn&apos;t appear to be valid.</p>
        <a href="/" style={{ padding: "10px 22px", fontSize: 13, fontWeight: 700, color: "#060709", background: "#eef0f4", textDecoration: "none", borderRadius: 8 }}>Go home</a>
      </div>
    </div>
  );
}
