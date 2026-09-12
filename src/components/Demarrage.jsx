import { Mountain } from 'lucide-react'
import { APP_VERSION } from './Header.jsx'

// Premier écran vu à l'ouverture de l'appli : juste l'identité visuelle et un accès
// discret pour les professeurs. L'élève poursuit avec "Commencer" vers l'identification.
export default function Demarrage({ onCommencer, onAccesEnseignant }) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-roche-800 flex items-center justify-center mb-6 shadow-lg">
        <Mountain className="text-roche-200" size={44} />
      </div>
      <h1 className="font-display text-2xl text-roche-900 mb-1">Escalade Pro</h1>
      <p className="text-xs text-roche-400 mb-10">by C. Guilhem · v{APP_VERSION}</p>

      <button
        onClick={onCommencer}
        className="w-full max-w-xs bg-roche-800 hover:bg-roche-700 text-white font-medium py-3.5 rounded-xl transition active:scale-[0.98] mb-6"
      >
        Commencer
      </button>

      <button onClick={onAccesEnseignant} className="text-sm text-roche-500 hover:text-roche-700 transition">
        Tu es professeur ? <span className="font-medium">Connexion ici →</span>
      </button>
    </div>
  )
}
