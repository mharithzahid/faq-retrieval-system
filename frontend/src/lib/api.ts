export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export type Faq = {
  id: number;
  question: string;
  answer: string;
  tags: string[];
  lang: string;
};

export async function getFaqs(params?: { lang?: string }) {
  const qs = params?.lang ? `?lang=${encodeURIComponent(params.lang)}` : '';
  const r = await fetch(`${API_BASE}/faqs${qs}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Failed to fetch FAQs');
  return (await r.json()) as Faq[];
}

export async function getFaq(id: number) {
  const r = await fetch(`${API_BASE}/faqs/${id}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Failed to fetch FAQ');
  return (await r.json()) as Faq;
}

export async function createFaq(data: Omit<Faq, 'id'>) {
  const r = await fetch(`${API_BASE}/faqs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Failed to create FAQ');
  return await r.json();
}

export async function updateFaq(id: number, data: Partial<Omit<Faq, 'id'>>) {
  const r = await fetch(`${API_BASE}/faqs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Failed to update FAQ');
  return await r.json();
}

export async function deleteFaq(id: number) {
  const r = await fetch(`${API_BASE}/faqs/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to delete FAQ');
  return await r.json();
}

export type AskResponse = {
  items: Array<{
    id: number;
    question: string;
    answer: string;
    tags: string[];
    lang: string;
    score: number;
  }>;
  ambiguous: boolean;
  threshold: number;
  fallback?: string;
};

export async function ask(text: string, lang = 'en') {
  const r = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  });
  if (!r.ok) throw new Error('Ask failed');
  return (await r.json()) as AskResponse;
}
