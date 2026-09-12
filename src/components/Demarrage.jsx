import { useEffect } from 'react'
import { Mountain } from 'lucide-react'
import { APP_VERSION } from './Header.jsx'

// Écran vu très brièvement à l'ouverture de l'appli (juste l'icône), puis bascule
// automatiquement vers l'identification élève, sans aucune action requise.
export default function Demarrage({ onTermine }) {
  useEffect(() => {
    const t = setTimeout(onTermine, 700)
    return () => clearTimeout(t)
  }, [onTermine])

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-roche-800 flex items-center justify-center mb-6 shadow-lg">
        <Mountain className="text-roche-200" size={44} />
      </div>
      <h1 className="font-display text-2xl text-roche-900 mb-1">Escalade Pro</h1>
      <p className="text-xs text-roche-400">by C. Guilhem · v{APP_VERSION}</p>
    </div>
  )
}
