import { useEffect, useState } from 'react'
import { getAllNotes, deleteNote, markRecalled, Note, REVISION_SCHEDULE, getStageLabel, isMastered } from '../lib/notes'
import type { Difficulty } from '../lib/notes'
import NoteCard from './NoteCard'
import toast from 'react-hot-toast'
import styles from './AllNotes.module.css'

type DateFilter = 'all' | 'today' | 'yesterday'
type StageFilter = 'all' | 'active' | 'mastered'

function isSameDay(date: Date, target: Date): boolean {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  )
}

export default function AllNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

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
      const difficulty = (note.difficulty || 'medium') as Difficulty
      const schedule = REVISION_SCHEDULE[difficulty]
      const nextStage = note.stage + 1
      const mastered = nextStage >= schedule.length
      toast.success(mastered ? `🏆 Mastered!` : `✅ Advanced to ${getStageLabel(difficulty, nextStage)}!`)
      load()
    } catch {
      toast.error('Failed to update note')
    }
  }

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const filtered = notes.filter(n => {
    const learnedDate = new Date(n.learned_date)

    const matchDate =
      dateFilter === 'all'       ? true :
      dateFilter === 'today'     ? isSameDay(learnedDate, today) :
      dateFilter === 'yesterday' ? isSameDay(learnedDate, yesterday) :
      true

    const matchStage =
      stageFilter === 'all'      ? true :
      stageFilter === 'mastered' ? isMastered(n) :
      stageFilter === 'active'   ? !isMastered(n) :
      true

    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())

    return matchDate && matchStage && matchSearch
  })

  // Count helpers for badges
  const todayCount = notes.filter(n => isSameDay(new Date(n.learned_date), today)).length
  const yesterdayCount = notes.filter(n => isSameDay(new Date(n.learned_date), yesterday)).length

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>Loading notes...</span>
    </div>
  )

  return (
    <div>
      {/* Date filter pills */}
      <div className={styles.dateFilters}>
        {([
          { key: 'all',       label: 'All Time',  count: notes.length },
          { key: 'today',     label: 'Today',     count: todayCount },
          { key: 'yesterday', label: 'Yesterday', count: yesterdayCount },
        ] as { key: DateFilter; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            className={`${styles.datePill} ${dateFilter === key ? styles.datePillActive : ''}`}
            onClick={() => setDateFilter(key)}
          >
            {label}
            <span className={`${styles.pillCount} ${dateFilter === key ? styles.pillCountActive : ''}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + stage filter toolbar */}
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
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value as StageFilter)}
        >
          <option value="all">All Stages</option>
          <option value="active">In Progress</option>
          <option value="mastered">Mastered</option>
        </select>
        <span className={styles.count}>
          {filtered.length} note{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div>
            {dateFilter === 'today'     ? '📅' :
             dateFilter === 'yesterday' ? '📆' : '🔍'}
          </div>
          <div>
            {dateFilter === 'today'     ? "You haven't added any notes today yet" :
             dateFilter === 'yesterday' ? 'No notes from yesterday' :
             search                     ? `No notes matching "${search}"` :
             'No notes yet'}
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onRecalled={() => handleRecalled(note)}
              onDelete={() => handleDelete(note.id)}
              showRecallButton={!isMastered(note)}
            />
          ))}
        </div>
      )}
    </div>
  )
}