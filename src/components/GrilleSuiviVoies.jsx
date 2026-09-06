import { Fragment } from 'react'
import { codeCourtCellule, passagesCellule, celluleAuMoinsUneReussite } from '../utils/passages.js'

const SOUS_COLONNES = [3, 2, 1] // ordre d'affichage : 3 couleurs, puis 2, puis 1

// Tableau générique de suivi de cycle : 1 ligne par élève (ou 1 seule ligne côté élève),
// 17 voies en colonnes, chacune divisée en 3 sous-colonnes (3/2/1 couleur(s) de prise).
// lignes : [{ key, titre, equipe?, passages: [] }]
// onCellClick(ligne, numeroVoie, nbCouleurs, passagesDeLaCellule)
export default function GrilleSuiviVoies({ voies, lignes, onCellClick, grouperParEquipe = false }) {
  const lignesTriees = grouperParEquipe
    ? [...lignes].sort((a, b) => {
        const ea = a.equipe || ''
        const eb = b.equipe || ''
        if (ea !== eb) return ea.localeCompare(eb, 'fr')
        return (a.titre || '').localeCompare(b.titre || '', 'fr')
      })
    : lignes

  let equipeCourante = Symbol('init')

  return (
    <div className="overflow-x-auto border border-roche-100 rounded-xl">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 bg-roche-50 text-left px-2 py-1.5 text-roche-500 uppercase text-[10px] align-bottom border-b border-roche-200 z-10 whitespace-nowrap"
            >
              Élève
            </th>
            {voies.map((v) => (
              <th
                key={v.numero}
                colSpan={3}
                className="text-center px-1 py-1 text-roche-700 font-semibold border-b border-l border-roche-200 bg-roche-50 whitespace-nowrap"
              >
                Voie {v.numero}
              </th>
            ))}
          </tr>
          <tr>
            {voies.map((v) =>
              SOUS_COLONNES.map((n) => {
                const c = v.couleurs?.[n] || { nom: '', difficulte: '' }
                return (
                  <th
                    key={`${v.numero}-${n}`}
                    className="px-1 py-1 text-roche-500 border-b border-l border-roche-100 font-normal whitespace-nowrap"
                    title={`${n} couleur${n > 1 ? 's' : ''} de prise`}
                  >
                    {c.nom || '—'}
                    {c.difficulte ? ` ${c.difficulte}` : ''}
                  </th>
                )
              })
            )}
          </tr>
        </thead>
        <tbody>
          {lignesTriees.length === 0 && (
            <tr>
              <td colSpan={1 + voies.length * 3} className="px-2 py-3 text-roche-500 text-center">
                Aucun élève à afficher.
              </td>
            </tr>
          )}
          {lignesTriees.map((ligne) => {
            const nouvelleEquipe = grouperParEquipe && ligne.equipe !== equipeCourante
            equipeCourante = ligne.equipe
            return (
              <Fragment key={ligne.key}>
                {nouvelleEquipe && ligne.equipe && (
                  <tr className="bg-roche-100">
                    <td colSpan={1 + voies.length * 3} className="px-2 py-1 text-[10px] font-semibold uppercase text-roche-700 sticky left-0 bg-roche-100">
                      {ligne.equipe}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-roche-100">
                  <td className="sticky left-0 bg-white px-2 py-1.5 font-medium text-roche-900 whitespace-nowrap">
                    {ligne.titre}
                  </td>
                  {voies.map((v) =>
                    SOUS_COLONNES.map((n) => {
                      const cellulePassages = passagesCellule(ligne.passages, v.numero, n)
                      const code = codeCourtCellule(ligne.passages, v.numero, n)
                      const reussite = celluleAuMoinsUneReussite(ligne.passages, v.numero, n)
                      return (
                        <td key={`${v.numero}-${n}`} className="border-l border-roche-100 p-0">
                          <button
                            type="button"
                            disabled={cellulePassages.length === 0}
                            onClick={() => onCellClick && onCellClick(ligne, v.numero, n, cellulePassages)}
                            className={`w-full h-full min-w-[38px] px-1.5 py-1.5 text-center font-mono ${
                              cellulePassages.length
                                ? `hover:bg-roche-50 cursor-pointer text-roche-900 ${reussite ? 'font-bold' : 'font-normal'}`
                                : 'text-roche-200'
                            }`}
                          >
                            {code || '·'}
                          </button>
                        </td>
                      )
                    })
                  )}
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
