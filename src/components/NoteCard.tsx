import { Note, STAGES, REVISION_DAYS } from '../lib/notes'
import styles from './NoteCard.module.css'

interface Props {
  note: Note
  onRecalled?: () => void
  onDelete?: () => void
  showRecallButton?: boolean
}

export default function NoteCard({ note, onRecalled, onDelete, showRecallButton }: Props) {
  const isMastered = note.stage >= REVISION_DAYS.length
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

  function getDueClass() {
    if (isOverdue) return styles.tagOverdue
    return styles.tagDue
  }

  return (
    <div className={styles.card}>
      <div className={styles.body}>
        <div className={styles.title}>{note.title}</div>
        <div className={styles.summary}>
          {note.summary.substring(0, 180)}{note.summary.length > 180 ? '…' : ''}
        </div>

        <div className={styles.meta}>
          <span className={styles.tagCategory}>{note.category}</span>

          {isMastered
            ? <span className={styles.tagMastered}>🏆 Mastered</span>
            : <span className={styles.tagStage}>{STAGES[note.stage]}</span>
          }

          {!isMastered && note.next_revision && (
            <span className={`${styles.tag} ${getDueClass()}`}>
              {getDueLabel()}
            </span>
          )}

          {note.source && (
            <span className={styles.source}>📖 {note.source}</span>
          )}
        </div>

        {/* Revision timeline */}
        {!isMastered && (
          <div className={styles.timeline}>
            {['Learn', '1d', '3d', '7d', '14d', '21d'].map((label, i) => {
              const isDone = i <= note.stage
              const isActive = i === note.stage + 1
              return (
                <div key={i} className={styles.tlItem}>
                  <div className={`${styles.tlNode} ${isDone ? styles.done : ''} ${isActive ? styles.active : ''}`} />
                  <div className={`${styles.tlLabel} ${isActive ? styles.tlActive : ''}`}>{label}</div>
                  {i < 5 && <div className={`${styles.tlLine} ${isDone ? styles.done : ''}`} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {showRecallButton && !isMastered && onRecalled && (
          <button className={styles.btnSuccess} onClick={onRecalled}>
            ✓ Recalled
          </button>
        )}
        {onDelete && (
          <button className={styles.btnGhost} onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
