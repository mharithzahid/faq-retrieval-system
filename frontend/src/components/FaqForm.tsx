'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Faq } from '@/lib/api';
import { createFaq, updateFaq } from '@/lib/api';

type Props = {
  mode: 'create' | 'edit';
  initial?: Faq;
};

export default function FaqForm({ mode, initial }: Props) {
  const [question, setQuestion] = useState(initial?.question || '');
  const [answer, setAnswer] = useState(initial?.answer || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [lang, setLang] = useState(initial?.lang || 'en');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    try {
      const tagsArr = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (mode === 'create') {
        await createFaq({ question, answer, tags: tagsArr, lang });
      } else if (initial) {
        await updateFaq(initial.id, { question, answer, tags: tagsArr, lang });
      }

      router.push('/admin');
    } catch (e: any) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'grid', gap: 8, maxWidth: 640 }}
    >
      <label>Question</label>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
      />

      <label>Answer</label>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={4}
      />

      <label>Tags (comma-separated)</label>
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <label>Language</label>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="en">en</option>
      </select>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>

      {err && <div style={{ color: 'red' }}>{err}</div>}
    </form>
  );
}
