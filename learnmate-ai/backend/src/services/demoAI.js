// Demo Mode engine: no Gemini calls. Everything is derived from the user's own uploaded text
// (extractive answers, cloze-style questions), so the app stays demo-able without an API key.
import { words } from './context.js';

export const REFUSAL = "I couldn't find information about this in your uploaded material.";
const sentences = (t) => (t.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]/g) || []).map((s) => s.trim()).filter((s) => s.length >= 40 && s.length <= 260);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const title = (w) => w.charAt(0).toUpperCase() + w.slice(1);

export function answer(doc, question, level) {
  const q = new Set(words(question));
  const scored = [];
  for (const c of doc.chunks) for (const s of sentences(c.text)) {
    const w = words(s), hits = w.filter((x) => q.has(x)).length;
    if (hits) scored.push({ page: c.page, s, score: hits / Math.sqrt(w.length + 1) });
  }
  if (!scored.length) return REFUSAL;
  const n = { beginner: 2, intermediate: 3, advanced: 5 }[level];
  const top = scored.sort((a, b) => b.score - a.score).slice(0, n).sort((a, b) => a.page - b.page);
  const intro = {
    beginner: 'Here is the simple version, straight from your document:',
    intermediate: 'Here is what your document says about this:',
    advanced: 'Relevant passages from your document, in page order:',
  }[level];
  return `${intro}\n\n${top.map((t) => `• ${t.s} [Page ${t.page}]`).join('\n')}\n\n(Demo Mode: extractive answer. Turn Demo Mode off for full Gemini explanations.)`;
}

export function quiz(doc, count, weakTopics = []) {
  const freq = new Map();
  for (const c of doc.chunks) for (const w of words(c.text)) freq.set(w, (freq.get(w) || 0) + 1);
  const vocab = [...freq].filter(([w, n]) => n >= 2 && w.length >= 5).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const pool = [], seen = new Set();
  for (const c of doc.chunks) for (const s of sentences(c.text)) {
    if (seen.has(s)) continue;
    const cand = [...new Set(words(s))].filter((w) => vocab.includes(w));
    if (!cand.length) continue;
    const answerWord = [...cand].sort((a, b) => b.length - a.length)[0];
    const topicWord = [...cand].sort((a, b) => freq.get(b) - freq.get(a))[0];
    const blanked = s.replace(new RegExp(`\\b${answerWord}\\b`, 'i'), '_____');
    if (blanked === s) continue;
    seen.add(s);
    pool.push({ s, page: c.page, answerWord, topic: title(topicWord), blanked });
  }
  if (pool.length < 3) throw Object.assign(new Error('This document does not contain enough text to build a quiz in Demo Mode.'), { status: 422 });
  const weak = new Set(weakTopics.map((t) => t.toLowerCase()));
  const picked = shuffle(pool).sort((a, b) => (weak.has(b.topic.toLowerCase()) ? 1 : 0) - (weak.has(a.topic.toLowerCase()) ? 1 : 0)).slice(0, count);
  return picked.map((p) => {
    const distractors = shuffle(vocab.slice(0, 60).filter((w) => w !== p.answerWord && !p.s.toLowerCase().includes(w))).slice(0, 3);
    const options = shuffle([p.answerWord, ...distractors]);
    return {
      topic: p.topic,
      question: `Fill in the blank: "${p.blanked}"`,
      options,
      correctIndex: options.indexOf(p.answerWord),
      explanation: `The document states: "${p.s}" [Page ${p.page}]`,
    };
  });
}

export function plan(mastery, days) {
  const ranked = [...mastery].sort((a, b) => a.percent - b.percent);
  const focus = ranked.filter((m) => m.level !== 'strong');
  const targets = (focus.length ? focus : ranked).slice(0, 3).map((m) => m.topic);
  const T = (i) => targets[i % targets.length];
  const templates = [
    (t) => ({ title: `Re-learn ${t}`, tasks: [
      { text: `Ask the AI Tutor (Beginner mode) to explain ${t}, then write a 5-line summary`, minutes: 20, type: 'tutor' },
      { text: `Re-read every page that mentions ${t} and highlight key definitions`, minutes: 25, type: 'revise' }] }),
    (t) => ({ title: `Practice ${t}`, tasks: [
      { text: `Take a 5-question quiz and aim to beat your previous ${t} score`, minutes: 15, type: 'quiz' },
      { text: `Write down why each missed answer was wrong`, minutes: 15, type: 'revise' }] }),
    (t) => ({ title: `Go deeper on ${t}`, tasks: [
      { text: `Ask the tutor (Advanced mode) how ${t} connects to other topics`, minutes: 20, type: 'tutor' },
      { text: `Teach ${t} out loud for 3 minutes without notes`, minutes: 10, type: 'revise' }] }),
    () => ({ title: 'Mixed review', tasks: [
      { text: 'Take a 10-question quiz across the whole document', minutes: 25, type: 'quiz' },
      { text: 'Review all explanations for incorrect answers', minutes: 15, type: 'revise' }] }),
  ];
  return {
    summary: `Focus on ${targets.join(', ')}: your lowest-mastery topics. Each day pairs a short explanation session with quiz practice.`,
    days: Array.from({ length: days }, (_, i) => ({ day: i + 1, ...templates[i % templates.length](T(i)) })),
  };
}
