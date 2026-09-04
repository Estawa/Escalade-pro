// Une difficulté d'escalade est représentée en interne comme une chaîne, ex. "5a+".
// chiffre : 3 à 7 (3 = plus simple, 7 = plus difficile)
// lettre : a, b ou c (sous-classement dans le chiffre)
// plus : suffixe optionnel "+" quand la voie est à cheval entre deux difficultés proches

export const CHIFFRES = [3, 4, 5, 6, 7]
export const LETTRES = ['a', 'b', 'c']

export function formatDifficulte({ chiffre, lettre, plus }) {
  if (!chiffre || !lettre) return ''
  return `${chiffre}${lettre}${plus ? '+' : ''}`
}

export function parseDifficulte(chaine) {
  const m = /^([3-7])([a-c])(\+)?$/.exec((chaine || '').trim())
  if (!m) return { chiffre: '', lettre: '', plus: false }
  return { chiffre: m[1], lettre: m[2], plus: !!m[3] }
}

// Ordre de comparaison simple entre deux difficultés (pour trier / comparer une progression)
export function rangDifficulte(chaine) {
  const { chiffre, lettre, plus } = parseDifficulte(chaine)
  if (!chiffre) return 0
  const rangLettre = { a: 0, b: 1, c: 2 }[lettre] || 0
  return Number(chiffre) * 10 + rangLettre * 3 + (plus ? 1.5 : 0)
}
