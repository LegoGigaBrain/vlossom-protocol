export default function AdminDashboard() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Vlossom Admin
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Admin panel - coming soon.
      </p>

      <div style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
      }}>
        <div style={{
          padding: "1rem",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fafafa"
        }}>
          <h2 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Users</h2>
          <p style={{ fontSize: "0.875rem", color: "#888" }}>Manage platform users</p>
        </div>

        <div style={{
          padding: "1rem",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fafafa"
        }}>
          <h2 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Bookings</h2>
          <p style={{ fontSize: "0.875rem", color: "#888" }}>View and manage bookings</p>
        </div>

        <div style={{
          padding: "1rem",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fafafa"
        }}>
          <h2 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Disputes</h2>
          <p style={{ fontSize: "0.875rem", color: "#888" }}>Handle dispute resolutions</p>
        </div>

        <div style={{
          padding: "1rem",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fafafa"
        }}>
          <h2 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>DeFi Config</h2>
          <p style={{ fontSize: "0.875rem", color: "#888" }}>Configure pool parameters</p>
        </div>
      </div>

      <footer style={{ marginTop: "3rem", paddingTop: "1rem", borderTop: "1px solid #e5e5e5" }}>
        <p style={{ fontSize: "0.75rem", color: "#888" }}>
          Vlossom Protocol Admin v6.4.0
        </p>
      </footer>
    </main>
  );
}
