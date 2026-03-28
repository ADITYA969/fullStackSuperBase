import { useState } from 'react'
import { addNote } from '../lib/notes'
import toast from 'react-hot-toast'
import styles from './AddNote.module.css'

interface Props {
  onSaved: () => void
}

const CATEGORIES = [
  'Engineering',
  'Finance / Markets',
  'System Design',
  'DSA',
  'Books',
  'Other',
]

export default function AddNote({ onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('Engineering')
  const [source, setSource] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) { toast.error('Please enter a title'); return }
    if (!summary.trim()) { toast.error('Please enter key takeaways'); return }

    setSaving(true)
    try {
      await addNote({
        title: title.trim(),
        summary: summary.trim(),
        category,
        source: source.trim() || undefined,
        learnedDate: new Date(date),
      })
      toast.success(`✅ "${title}" saved! Revisions scheduled at day 1, 3, 7, 14, 21.`)
      setTitle('')
      setSummary('')
      setSource('')
      setDate(new Date().toISOString().split('T')[0])
      onSaved()
    } catch {
      toast.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>📝 Capture What You Learned</div>

      <div className={styles.scheduleInfo}>
        🗓 Revision reminders will be sent automatically on Day 1 · 3 · 7 · 14 · 21
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Title / Topic *</label>
          <input
            className={styles.input}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. TypeScript Generics — Conditional Types"
          />
        </div>
        <div className={`${styles.formGroup} ${styles.narrow}`}>
          <label className={styles.label}>Category</label>
          <select
            className={styles.input}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Key Takeaways / Summary *</label>
          <textarea
            className={styles.textarea}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Write the key insight or concept. Be concise — this is what you'll review later."
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Source (optional)</label>
          <input
            className={styles.input}
            type="text"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="Book name, URL, course, video..."
          />
        </div>
        <div className={`${styles.formGroup} ${styles.narrow}`}>
          <label className={styles.label}>Date Learned</label>
          <input
            className={styles.input}
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      <button
        className={styles.btnPrimary}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save & Schedule Revisions →'}
      </button>
    </div>
  )
}
