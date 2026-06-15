export default function AuthCard({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'radial-gradient(ellipse at top, #FDE68A 0%, #FEF3DC 40%, #f8f9fa 70%)',
      }}
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white p-6 sm:p-8 w-full max-w-md auth-card-inner">
        {children}
      </div>
    </div>
  )
}

export function LogoMark() {
  return (
    <div className="flex justify-center mb-6">
      <img 
        src="/logo.png" 
        alt="Intelimerch" 
        className="h-12 w-auto object-contain"
      />
    </div>
  )
}