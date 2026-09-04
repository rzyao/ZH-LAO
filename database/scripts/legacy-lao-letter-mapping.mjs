const TONE_MARKS = new Set(['່', '້', '໊', '໋']);

const OTHER_SUBTYPES = new Map([
  ['ຼ', 'symbol_ligature'],
  ['ໆ', 'symbol_repeat'],
  ['ຯ', 'symbol_special'],
  ['໌', 'symbol_other'],
]);

export function mapLegacyLaoLetter(row) {
  const sourceClassification = String(row.classification ?? '');
  const character = String(row.lao ?? '');
  const base = {
    sourceId: String(row.id),
    character,
    romanization: row.phonetic == null ? null : String(row.phonetic),
    name: row.description == null || String(row.description).trim() === '' ? null : String(row.description),
  };

  if (sourceClassification === '2') {
    return { ...base, letterType: 'consonant', letterClass: requiredSubtype(row) };
  }
  if (sourceClassification === '1') {
    return { ...base, letterType: 'vowel', letterClass: requiredSubtype(row) };
  }
  if (sourceClassification === '3' && TONE_MARKS.has(character)) {
    return { ...base, letterType: 'tone_mark', letterClass: 'symbol_tone', romanization: '-' };
  }
  if (sourceClassification === '3' && OTHER_SUBTYPES.has(character)) {
    return { ...base, letterType: 'other', letterClass: OTHER_SUBTYPES.get(character), romanization: row.phonetic === '-' ? '-' : base.romanization };
  }
  throw new Error(`Unsupported legacy letter mapping: id=${base.sourceId}, classification=${sourceClassification}, character=${character}`);
}

function requiredSubtype(row) {
  const subtype = String(row.subtype ?? '').trim();
  if (!subtype) throw new Error(`Missing subtype for legacy letter id=${row.id}`);
  return subtype;
}

export function assignSortOrders(rows) {
  const typeRank = { consonant: 1, vowel: 2, tone_mark: 3, other: 4 };
  const ordered = [...rows].sort((a, b) => (
    typeRank[a.letterType] - typeRank[b.letterType]
    || a.letterClass.localeCompare(b.letterClass, 'en')
    || a.character.localeCompare(b.character, 'lo')
    || a.sourceId.localeCompare(b.sourceId, 'en')
  ));
  return ordered.map((row, index) => ({ ...row, sortOrder: index + 1 }));
}
