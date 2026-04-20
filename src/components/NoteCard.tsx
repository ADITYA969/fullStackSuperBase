import { useState } from 'react'
import { Note, REVISION_SCHEDULE, DIFFICULTY_LABELS, DIFFICULTY_COLORS, getStageLabel, isMastered, editNote, snoozeNote } from '../lib/notes'
import type { Difficulty } from '../lib/notes'
import toast from 'react-hot-toast'
import styles from './NoteCard.module.css'

const CATEGORIES = ['Engineering', 'Finance / Markets', 'System Design', 'DSA', 'Books', 'Other']

interface Props {
  note: Note
  onRecalled?: () => void
  onForgot?: () => void
  onUndo?: () => void
  onDelete?: () => void
  onEdited?: () => void
  onSnoozed?: () => void
  showRecallButton?: boolean
}

export default function NoteCard({
  note, onRecalled, onForgot, onUndo, onDelete, onEdited, onSnoozed, showRecallButton
}: Props) {
  const [revealed, setRevealed]   = useState(false)
  const [justActed, setJustActed] = useState<'recalled' | 'forgot' | 'snoozed' | null>(null)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [snoozing, setSnoozing]   = useState(false)

  // Edit state
  const [editTitle,    setEditTitle]    = useState(note.title)
  const [editSummary,  setEditSummary]  = useState(note.summary)
  const [editCategory, setEditCategory] = useState(note.category)
  const [editSource,   setEditSource]   = useState(note.source || '')
  const [editDiff,     setEditDiff]     = useState<Difficulty>(note.difficulty || 'medium')

  const mastered   = isMastered(note)
  const difficulty = (note.difficulty || 'medium') as Difficulty
  const schedule   = REVISION_SCHEDULE[difficulty]
  const diffColor  = DIFFICULTY_COLORS[difficulty]

  const isOverdue = note.next_revision && new Date(note.next_revision) < new Date()
  const daysUntil = note.next_revision
    ? Math.ceil((new Date(note.next_revision).getTime() - Date.now()) / 86400000)
    : null

  function getDueLabel() {
    if (!note.next_revision) return null
    if (isOverdue) return `⚠️ Overdue by ${Math.abs(daysUntil!)}d`
    if (daysUntil === 0) return '🔴 Due today'
    return `📅 Due in ${daysUntil}d`
  }

  function handleRecalled() {
    if (onRecalled) {
      onRecalled()
      setJustActed('recalled')
      setTimeout(() => setJustActed(null), 8000)
    }
  }

  function handleForgot() {
    if (onForgot) {
      onForgot()
      setJustActed('forgot')
      setTimeout(() => setJustActed(null), 8000)
    }
  }

  async function handleSnooze() {
    setSnoozing(true)
    try {
      await snoozeNote(note)
      setJustActed('snoozed')
      setTimeout(() => setJustActed(null), 8000)
      toast(`⏰ Snoozed! "${note.title}" will remind you tomorrow`, {
        icon: '😴',
        style: {
          background: '#12121a',
          color: '#f7d96a',
          border: '1px solid rgba(247,217,106,0.3)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
        }
      })
      if (onSnoozed) onSnoozed()
    } catch {
      toast.error('Failed to snooze')
    } finally {
      setSnoozing(false)
    }
  }

  function handleUndo() {
    if (onUndo) { onUndo(); setJustActed(null) }
  }

  function startEdit() {
    setEditTitle(note.title)
    setEditSummary(note.summary)
    setEditCategory(note.category)
    setEditSource(note.source || '')
    setEditDiff(note.difficulty || 'medium')
    setEditing(true)
    setRevealed(true)
  }

  async function saveEdit() {
    if (!editTitle.trim())   { toast.error('Title cannot be empty'); return }
    if (!editSummary.trim()) { toast.error('Summary cannot be empty'); return }
    setSaving(true)
    try {
      await editNote(note.id, {
        title:      editTitle.trim(),
        summary:    editSummary.trim(),
        category:   editCategory,
        source:     editSource.trim() || undefined,
        difficulty: editDiff,
      })
      toast.success('✅ Note updated!')
      setEditing(false)
      if (onEdited) onEdited()
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setEditing(false)
    setEditTitle(note.title)
    setEditSummary(note.summary)
    setEditCategory(note.category)
    setEditSource(note.source || '')
    setEditDiff(note.difficulty || 'medium')
  }

  // ── EDIT MODE ─────────────────────────────────────────
  if (editing) {
    return (
      <div className={`${styles.card} ${styles.cardEditing}`}>
        <div className={styles.body}>
          <div className={styles.editHeader}>✏️ Editing note</div>

          <div className={styles.editRow}>
            <div className={styles.editGroup}>
              <label className={styles.editLabel}>Title</label>
              <input className={styles.editInput} value={editTitle}
                onChange={e => setEditTitle(e.target.value)} placeholder="Title / Topic" />
            </div>
            <div className={styles.editGroupNarrow}>
              <label className={styles.editLabel}>Category</label>
              <select className={styles.editInput} value={editCategory}
                onChange={e => setEditCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.editGroup} style={{ marginBottom: '0.75rem' }}>
            <label className={styles.editLabel}>Summary / Key Takeaways</label>
            <textarea className={styles.editTextarea} value={editSummary}
              onChange={e => setEditSummary(e.target.value)} placeholder="Key insights..." />
          </div>

          <div className={styles.editRow}>
            <div className={styles.editGroup}>
              <label className={styles.editLabel}>Source</label>
              <input className={styles.editInput} value={editSource}
                onChange={e => setEditSource(e.target.value)} placeholder="Book, URL, course..." />
            </div>
            <div className={styles.editGroupNarrow}>
              <label className={styles.editLabel}>Difficulty</label>
              <select className={styles.editInput} value={editDiff}
                onChange={e => setEditDiff(e.target.value as Difficulty)}>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          </div>

          <div className={styles.editActions}>
            <button className={styles.btnSave} onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button className={styles.btnCancel} onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW MODE ─────────────────────────────────────────
  return (
    <div className={`${styles.card} ${justActed === 'forgot' ? styles.cardForgot : ''} ${justActed === 'snoozed' ? styles.cardSnoozed : ''}`}>
      <div className={styles.body}>

        {/* Title row */}
        <div className={styles.titleRow}>
          <div className={styles.title}>{note.title}</div>
          <div className={styles.badges}>
            {(note.forgot_count > 0) && (
              <span className={styles.forgotBadge} title="Times forgotten">
                ✗ {note.forgot_count}x
              </span>
            )}
            <span className={styles.diffBadge}
              style={{ color: diffColor, borderColor: diffColor + '55', background: diffColor + '15' }}>
              {DIFFICULTY_LABELS[difficulty]}
            </span>
          </div>
        </div>

        {/* Answer block */}
        <div className={styles.answerBlock}>
          {revealed ? (
            <div className={styles.summary}>{note.summary}</div>
          ) : (
            <button className={styles.showBtn} onClick={() => setRevealed(true)}>
              👁 Show Answer
            </button>
          )}
          {revealed && (
            <button className={styles.hideBtn} onClick={() => setRevealed(false)}>Hide</button>
          )}
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          <span className={styles.tagCategory}>{note.category}</span>
          {mastered
            ? <span className={styles.tagMastered}>🏆 Mastered</span>
            : <span className={styles.tagStage}>{getStageLabel(difficulty, note.stage)}</span>
          }
          {!mastered && note.next_revision && (
            <span className={`${styles.tag} ${isOverdue ? styles.tagOverdue : styles.tagDue}`}>
              {getDueLabel()}
            </span>
          )}
          {note.source && <span className={styles.source}>📖 {note.source}</span>}
        </div>

        {/* Snooze info banner */}
        {justActed === 'snoozed' && (
          <div className={styles.snoozeBanner}>
            😴 Snoozed — coming back tomorrow. Your stage progress is safe!
          </div>
        )}

        {/* Timeline */}
        {!mastered && (
          <div className={styles.timeline}>
            {['Learn', ...schedule.map(d => `${d}d`)].map((label, i) => {
              const isDone   = i <= note.stage
              const isActive = i === note.stage + 1
              return (
                <div key={i} className={styles.tlItem}>
                  <div
                    className={`${styles.tlNode} ${isDone ? styles.done : ''} ${isActive ? styles.active : ''}`}
                    style={isActive ? { background: diffColor, borderColor: diffColor, boxShadow: `0 0 6px ${diffColor}` } : {}}
                  />
                  <div className={`${styles.tlLabel} ${isActive ? styles.tlActive : ''}`}
                    style={isActive ? { color: diffColor } : {}}
                  >{label}</div>
                  {i < schedule.length && <div className={`${styles.tlLine} ${isDone ? styles.done : ''}`} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {/* Undo after acting */}
        {justActed && justActed !== 'snoozed' && onUndo && (
          <button className={styles.btnUndo} onClick={handleUndo}>↩ Undo</button>
        )}

        {/* Main action buttons */}
        {showRecallButton && !mastered && !justActed && (
          <>
            <button className={styles.btnSuccess} onClick={handleRecalled}>✓ Recalled</button>
            <button className={styles.btnForgot} onClick={handleForgot}>✗ Forgot</button>
            <button className={styles.btnSnooze} onClick={handleSnooze} disabled={snoozing}
              title="Busy today? Push to tomorrow without losing your stage">
              {snoozing ? '...' : '😴 Snooze'}
            </button>
          </>
        )}

        {/* Always-visible undo for stage > 0 */}
        {!justActed && note.stage > 0 && onUndo && (
          <button className={styles.btnUndoGhost} onClick={handleUndo} title="Revert to previous stage">↩</button>
        )}

        <button className={styles.btnEdit} onClick={startEdit} title="Edit note">✏️</button>
        {onDelete && (
          <button className={styles.btnGhost} onClick={onDelete}>Delete</button>
        )}
      </div>
    </div>
  )
}