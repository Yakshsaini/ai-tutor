const STOP = new Set('about after also because been before being between both could does from have here into just more most other over same should some such than that their them then there these they this those were what when where which while will with would your'.split(' '));
export const words = (t) => (t.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).filter((w) => !STOP.has(w));
const fmt = (pages) => pages.map((p) => `[Page ${p.page}]\n${p.text}`).join('\n\n');
const size = (doc) => doc.chunks.reduce((s, c) => s + c.text.length, 0);

/** Whole document if it fits; otherwise the pages most relevant to the question. */
export function contextFor(doc, question, { maxChars = 120000, topPages = 20 } = {}) {
  if (size(doc) <= maxChars) return fmt(doc.chunks);
  const q = new Set(words(question));
  const ranked = doc.chunks
    .map((c) => ({ c, score: words(c.text).filter((w) => q.has(w)).length }))
    .sort((a, b) => b.score - a.score).slice(0, topPages)
    .map((x) => x.c).sort((a, b) => a.page - b.page);
  return fmt(ranked);
}

/** Evenly sample pages across the document for quiz generation. */
export function sampleContext(doc, maxChars = 60000) {
  const total = size(doc);
  if (total <= maxChars) return fmt(doc.chunks);
  const step = Math.ceil(total / maxChars);
  return fmt(doc.chunks.filter((_, i) => i % step === 0)).slice(0, maxChars);
}
