import { useState } from 'react'
import { addNote, Difficulty, REVISION_SCHEDULE } from '../lib/notes'
import toast from 'react-hot-toast'
import styles from './AddNote.module.css'

interface Props {
  onSaved: () => void
}

const CATEGORIES = ['Engineering', 'Finance / Markets', 'System Design', 'DSA', 'Books', 'Other']

const DIFFICULTY_INFO = {
  easy:   { label: '🟢 Easy',   desc: 'Already familiar — light refreshers', color: '#6af7c4' },
  medium: { label: '🟡 Medium', desc: 'New concept — standard schedule',      color: '#f7d96a' },
  hard:   { label: '🔴 Hard',   desc: 'Complex topic — intensive repetition', color: '#f76a6a' },
}

export default function AddNote({ onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('Engineering')
  const [source, setSource] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [saving, setSaving] = useState(false)

  const schedule = REVISION_SCHEDULE[difficulty]

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
        difficulty,
        learnedDate: new Date(date),
      })
      toast.success(`✅ Saved! Revisions scheduled at day ${schedule.join(', ')}.`)
      setTitle('')
      setSummary('')
      setSource('')
      setDate(new Date().toISOString().split('T')[0])
      setDifficulty('medium')
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

      {/* Difficulty selector */}
      <div className={styles.diffRow}>
        {(Object.entries(DIFFICULTY_INFO) as [Difficulty, typeof DIFFICULTY_INFO.easy][]).map(([key, info]) => (
          <button
            key={key}
            className={`${styles.diffBtn} ${difficulty === key ? styles.diffActive : ''}`}
            style={difficulty === key ? { borderColor: info.color, color: info.color, background: info.color + '15' } : {}}
            onClick={() => setDifficulty(key)}
          >
            <span className={styles.diffLabel}>{info.label}</span>
            <span className={styles.diffDesc}>{info.desc}</span>
          </button>
        ))}
      </div>

      {/* Schedule preview */}
      <div className={styles.scheduleInfo} style={{ borderColor: DIFFICULTY_INFO[difficulty].color + '44', color: DIFFICULTY_INFO[difficulty].color }}>
        🗓 Revision reminders on Day {schedule.join(' · ')}
        <span className={styles.scheduleCount}> · {schedule.length} repetitions</span>
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
          <select className={styles.input} value={category} onChange={e => setCategory(e.target.value)}>
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
            placeholder="Write the key insight or concept. This will be hidden behind 'Show Answer' during revision."
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
          <input className={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save & Schedule Revisions →'}
      </button>
    </div>
  )
}
