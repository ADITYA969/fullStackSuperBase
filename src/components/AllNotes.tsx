import { useEffect, useState } from 'react'
import { getAllNotes, deleteNote, markRecalled, markForgot, undoRecall, snoozeNote, Note, REVISION_SCHEDULE, getStageLabel, isMastered } from '../lib/notes'
import type { Difficulty } from '../lib/notes'
import NoteCard from './NoteCard'
import toast from 'react-hot-toast'
import styles from './AllNotes.module.css'

type DateTab    = 'all' | 'today' | 'yesterday'
type StageFilter = 'all' | 'active' | 'mastered'

function isSameDay(date: Date, target: Date): boolean {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  )
}

export default function AllNotes() {
  const [notes, setNotes]           = useState<Note[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [dateTab, setDateTab]       = useState<DateTab>('all')
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

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
    try { await deleteNote(id); toast.success('🗑️ Note deleted'); load() }
    catch { toast.error('Failed to delete note') }
  }

  async function handleRecalled(note: Note) {
    try {
      await markRecalled(note)
      const difficulty = (note.difficulty || 'medium') as Difficulty
      const schedule = REVISION_SCHEDULE[difficulty]
      const nextStage = note.stage + 1
      toast.success(nextStage >= schedule.length ? `🏆 Mastered!` : `✅ Advanced to ${getStageLabel(difficulty, nextStage)}!`)
      load()
    } catch { toast.error('Failed to update note') }
  }

  async function handleForgot(note: Note) {
    try {
      await markForgot(note)
      toast(`😔 Reset to Day 1 — reminder tomorrow`, {
        icon: '🔄',
        style: { background: '#12121a', color: '#f76a6a', border: '1px solid rgba(247,106,106,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }
      })
      load()
    } catch { toast.error('Failed to mark as forgot') }
  }

  async function handleUndo(note: Note) {
    try { await undoRecall(note); toast.success(`↩ Reverted back one stage`); load() }
    catch { toast.error('Failed to undo') }
  }

  async function handleSnooze(note: Note) {
    try {
      await snoozeNote(note)
      toast(`⏰ Snoozed! Coming back tomorrow`, {
        icon: '😴',
        style: { background: '#12121a', color: '#f7d96a', border: '1px solid rgba(247,217,106,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }
      })
      load()
    } catch { toast.error('Failed to snooze') }
  }

  const today     = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const todayCount     = notes.filter(n => isSameDay(new Date(n.learned_date), today)).length
  const yesterdayCount = notes.filter(n => isSameDay(new Date(n.learned_date), yesterday)).length

  const filtered = notes.filter(n => {
    const learnedDate = new Date(n.learned_date)

    const matchDate =
      dateTab === 'today'     ? isSameDay(learnedDate, today) :
      dateTab === 'yesterday' ? isSameDay(learnedDate, yesterday) :
      true

    const matchStage =
      stageFilter === 'mastered' ? isMastered(n) :
      stageFilter === 'active'   ? !isMastered(n) :
      true

    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())

    return matchDate && matchStage && matchSearch
  })

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>Loading notes...</span>
    </div>
  )

  return (
    <div>

      {/* Date tabs */}
      <div className={styles.dateTabs}>
        {([
          { key: 'all',       label: 'All Notes',  count: notes.length },
          { key: 'today',     label: 'Today',      count: todayCount },
          { key: 'yesterday', label: 'Yesterday',  count: yesterdayCount },
        ] as { key: DateTab; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            className={`${styles.dateTab} ${dateTab === key ? styles.dateTabActive : ''}`}
            onClick={() => setDateTab(key)}
          >
            {label}
            <span className={`${styles.tabCount} ${dateTab === key ? styles.tabCountActive : ''}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + stage filter */}
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
            {dateTab === 'today'     ? '📅' :
             dateTab === 'yesterday' ? '📆' : '🔍'}
          </div>
          <div>
            {dateTab === 'today'     ? "No notes added today yet" :
             dateTab === 'yesterday' ? "No notes from yesterday" :
             search                  ? `No notes matching "${search}"` :
             "No notes yet"}
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onRecalled={() => handleRecalled(note)}
              onForgot={() => handleForgot(note)}
              onUndo={() => handleUndo(note)}
              onSnoozed={() => handleSnooze(note)}
              onEdited={load}
              onDelete={() => handleDelete(note.id)}
              showRecallButton={!isMastered(note)}
            />
          ))}
        </div>
      )}
    </div>
  )
}