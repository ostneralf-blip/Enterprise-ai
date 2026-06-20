'use client'

export function LoginForm() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
      <h1 className="text-white text-xl font-semibold mb-6">DEBUG TEST</h1>
      <button
        type="button"
        onClick={() => alert('Button-Klick funktioniert! React ist aktiv.')}
        className="w-full bg-red-600 text-white font-medium py-2.5 rounded-lg"
      >
        TEST: Klick mich
      </button>
    </div>
  )
}
