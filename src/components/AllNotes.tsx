import { useEffect, useState } from 'react'
import { getAllNotes, deleteNote, markRecalled, Note, REVISION_DAYS, STAGES } from '../lib/notes'
import NoteCard from './NoteCard'
import toast from 'react-hot-toast'
import styles from './AllNotes.module.css'

export default function AllNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')

  async function load() {
    try {
      const data = await getAllNotes()
      setNotes(data)
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    try {
      await deleteNote(id)
      toast.success('🗑️ Note deleted')
      load()
    } catch {
      toast.error('Failed to delete note')
    }
  }

  async function handleRecalled(note: Note) {
    try {
      await markRecalled(note)
      const isMastered = note.stage + 1 >= REVISION_DAYS.length
      toast.success(isMastered ? `🏆 Mastered!` : `✅ Advanced to ${STAGES[note.stage + 1]}!`)
      load()
    } catch {
      toast.error('Failed to update note')
    }
  }

  const filtered = notes.filter(n => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())

    const matchStage =
      filterStage === 'all' ? true :
      filterStage === 'mastered' ? n.stage >= REVISION_DAYS.length :
      filterStage === 'active' ? n.stage < REVISION_DAYS.length :
      true

    return matchSearch && matchStage
  })

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>Loading notes...</span>
    </div>
  )

  return (
    <div>
      {/* Search + Filter bar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.filter}
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
        >
          <option value="all">All Notes</option>
          <option value="active">In Progress</option>
          <option value="mastered">Mastered</option>
        </select>
        <span className={styles.count}>{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div>🔍</div>
          <div>{search ? `No notes matching "${search}"` : 'No notes yet'}</div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onRecalled={() => handleRecalled(note)}
              onDelete={() => handleDelete(note.id)}
              showRecallButton={note.stage < REVISION_DAYS.length}
            />
          ))}
        </div>
      )}
    </div>
  )
}
