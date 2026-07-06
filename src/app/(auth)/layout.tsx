export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
            <span className="text-slate-900 text-xl font-semibold">AI Navigator</span>
          </div>
          <p className="text-slate-500 text-sm">Enterprise AI. Strukturiert navigiert.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
