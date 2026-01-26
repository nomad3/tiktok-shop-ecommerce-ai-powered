export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // All admin routes now redirect to dashboard
  // This layout just passes through for the redirects to work
  return <>{children}</>;
}
