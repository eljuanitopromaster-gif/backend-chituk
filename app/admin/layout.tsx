export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Since the global layout now has a sidebar, we don't need a nested one.
  return (
    <div style={{ padding: '24px' }}>
      {children}
    </div>
  );
}
