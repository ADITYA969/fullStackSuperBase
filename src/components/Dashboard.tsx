import { useEffect, useState } from 'react'
import { getAllNotes, getDueNotes, markRecalled, deleteNote, Note, STAGES, REVISION_DAYS } from '../lib/notes'
import toast from 'react-hot-toast'
import NoteCard from './NoteCard'
import styles from './Dashboard.module.css'

interface Props {
  onAddNote: () => void
}

export default function Dashboard({ onAddNote }: Props) {
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [dueNotes, setDueNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const [all, due] = await Promise.all([getAllNotes(), getDueNotes()])
      setAllNotes(all)
      setDueNotes(due)
    } catch (e) {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleRecalled(note: Note) {
    try {
      await markRecalled(note)
      const isMastered = note.stage + 1 >= REVISION_DAYS.length
      toast.success(isMastered
        ? `🏆 "${note.title}" mastered!`
        : `✅ Advanced to ${STAGES[note.stage + 1]}!`
      )
      load()
    } catch {
      toast.error('Failed to update note')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id)
      toast.success('🗑️ Note deleted')
      load()
    } catch {
      toast.error('Failed to delete note')
    }
  }

  const mastered = allNotes.filter(n => n.stage >= REVISION_DAYS.length)
  const upcoming = allNotes.filter(n => {
    if (!n.next_revision || n.stage >= REVISION_DAYS.length) return false
    const diff = new Date(n.next_revision).getTime() - Date.now()
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000
  })

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>Loading your notes...</span>
    </div>
  )

  return (
    <div>
      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Total Notes</div>
          <div className={styles.statValue}>{allNotes.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.red}`}>
          <div className={styles.statLabel}>Due Today</div>
          <div className={styles.statValue}>{dueNotes.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.orange}`}>
          <div className={styles.statLabel}>This Week</div>
          <div className={styles.statValue}>{upcoming.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Mastered</div>
          <div className={styles.statValue}>{mastered.length}</div>
        </div>
      </div>

      {/* Revision Queue */}
      <div className={styles.queueHeader}>
        <div className={styles.sectionTitle}>📬 Revision Queue</div>
      </div>

      {dueNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emoji}>🧠</div>
          <div>No revisions due. You're all caught up!</div>
          <button className={styles.addBtn} onClick={onAddNote}>
            + Add something you learned today
          </button>
        </div>
      ) : (
        <div className={styles.notesList}>
          {dueNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onRecalled={() => handleRecalled(note)}
              onDelete={() => handleDelete(note.id)}
              showRecallButton
            />
          ))}
        </div>
      )}
    </div>
  )
}
