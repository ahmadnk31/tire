export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full px-2 md:px-4 lg:px-8">
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}