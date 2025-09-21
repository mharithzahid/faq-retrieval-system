'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  ask,
  deleteFaq,
  getFaqs,
  type Faq,
  type AskResponse,
} from '@/lib/api';

export default function AdminDashboard() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [askText, setAskText] = useState('');
  const [askRes, setAskRes] = useState<AskResponse | null>(null);
  const [lang, setLang] = useState('en');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getFaqs({ lang });
      setFaqs(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [lang]);

  const onDelete = async (id: number) => {
    if (!confirm('Delete this FAQ?')) return;
    await deleteFaq(id);
    await load();
  };

  const onAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setAskRes(null);
    const res = await ask(askText, lang);
    setAskRes(res);
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <section
        style={{
          margin: '16px 0',
          padding: 12,
          border: '1px solid #ddd',
        }}
      >
        <h2>Ask tester</h2>
        <form
          onSubmit={onAsk}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <input
            style={{ flex: 1 }}
            placeholder="Type a user question..."
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
          />
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">en</option>
          </select>
          <button type="submit">Ask</button>
        </form>

        {askRes && (
          <div style={{ marginTop: 8 }}>
            {askRes.items.length === 0 ? (
              <div>{askRes.fallback || 'No match'}</div>
            ) : (
              <ol>
                {askRes.items.map((i) => (
                  <li key={i.id}>
                    <strong>Score: {i.score.toFixed(3)}</strong> — [{i.tags.join(', ')}] [{i.question}] [{i.answer}]
                  </li>
                ))}
              </ol>
            )}
            <div>Ambiguous: {String(askRes.ambiguous)}</div>
            <div>Threshold: {askRes.threshold}</div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2>FAQs</h2>
          <Link href="/admin/faqs/new">Add FAQ</Link>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <table
            cellPadding={6}
            style={{ borderCollapse: 'collapse', width: '100%' }}
          >
            <thead>
              <tr>
                <th align="left">ID</th>
                <th align="left">Question</th>
                <th align="left">Tags</th>
                <th align="left">Lang</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.id} style={{ borderTop: '1px solid #eee' }}>
                  <td>{f.id}</td>
                  <td>{f.question}</td>
                  <td>{f.tags.join(', ')}</td>
                  <td>{f.lang}</td>
                  <td>
                    <Link href={`/admin/faqs/${f.id}/edit`}>Edit</Link>{' '}
                    <button onClick={() => onDelete(f.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
