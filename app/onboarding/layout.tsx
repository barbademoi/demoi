import OnboardingProgress from './OnboardingProgress'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-text">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
          <p className="text-text-muted text-xs font-sans mt-1">Configuração inicial</p>
        </div>
        <OnboardingProgress />
        {children}
      </div>
    </main>
  )
}
