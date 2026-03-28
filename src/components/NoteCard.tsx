import { useState } from 'react'
import { Note, REVISION_SCHEDULE, DIFFICULTY_LABELS, DIFFICULTY_COLORS, getStageLabel, isMastered } from '../lib/notes'
import type { Difficulty } from '../lib/notes'
import styles from './NoteCard.module.css'

interface Props {
  note: Note
  onRecalled?: () => void
  onDelete?: () => void
  showRecallButton?: boolean
}

export default function NoteCard({ note, onRecalled, onDelete, showRecallButton }: Props) {
  const [revealed, setRevealed] = useState(false)

  const mastered = isMastered(note)
  const difficulty = (note.difficulty || 'medium') as Difficulty
  const schedule = REVISION_SCHEDULE[difficulty]
  const diffColor = DIFFICULTY_COLORS[difficulty]

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

  return (
    <div className={styles.card}>
      <div className={styles.body}>

        {/* Title row */}
        <div className={styles.titleRow}>
          <div className={styles.title}>{note.title}</div>
          <span
            className={styles.diffBadge}
            style={{ color: diffColor, borderColor: diffColor + '55', background: diffColor + '15' }}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        </div>

        {/* Answer / Summary — hidden until revealed */}
        <div className={styles.answerBlock}>
          {revealed ? (
            <div className={styles.summary}>{note.summary}</div>
          ) : (
            <button className={styles.showBtn} onClick={() => setRevealed(true)}>
              👁 Show Answer
            </button>
          )}
          {revealed && (
            <button className={styles.hideBtn} onClick={() => setRevealed(false)}>
              Hide
            </button>
          )}
        </div>

        {/* Meta tags */}
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

        {/* Revision timeline */}
        {!mastered && (
          <div className={styles.timeline}>
            {['Learn', ...schedule.map(d => `${d}d`)].map((label, i) => {
              const isDone = i <= note.stage
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
        {showRecallButton && !mastered && onRecalled && (
          <button className={styles.btnSuccess} onClick={onRecalled}>✓ Recalled</button>
        )}
        {onDelete && (
          <button className={styles.btnGhost} onClick={onDelete}>Delete</button>
        )}
      </div>
    </div>
  )
}
