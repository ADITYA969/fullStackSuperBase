import { supabase } from './supabase'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const REVISION_SCHEDULE: Record<Difficulty, number[]> = {
  easy:   [3, 14, 30],
  medium: [1, 3, 7, 14, 21],
  hard:   [1, 2, 4, 7, 14, 21, 30],
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   '🟢 Easy',
  medium: '🟡 Medium',
  hard:   '🔴 Hard',
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy:   '#6af7c4',
  medium: '#f7d96a',
  hard:   '#f76a6a',
}

export function getSchedule(difficulty: Difficulty): number[] {
  return REVISION_SCHEDULE[difficulty]
}

export function getStageLabel(difficulty: Difficulty, stage: number): string {
  const schedule = REVISION_SCHEDULE[difficulty]
  if (stage >= schedule.length) return 'Mastered'
  return `Day ${schedule[stage]}`
}

export function isMastered(note: Note): boolean {
  const schedule = REVISION_SCHEDULE[(note.difficulty as Difficulty)] || REVISION_SCHEDULE.medium
  return note.stage >= schedule.length
}

export interface Note {
  id: string
  title: string
  summary: string
  category: string
  source?: string
  difficulty: Difficulty
  learned_date: string
  next_revision: string | null
  stage: number
  revision_history: string[]
  forgot_count: number
  created_at: string
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ── Add note ──────────────────────────────────────────────
export async function addNote(note: {
  title: string
  summary: string
  category: string
  source?: string
  difficulty: Difficulty
  learnedDate: Date
}): Promise<Note> {
  const schedule = REVISION_SCHEDULE[note.difficulty]

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: note.title,
      summary: note.summary,
      category: note.category,
      source: note.source || null,
      difficulty: note.difficulty,
      learned_date: note.learnedDate.toISOString(),
      next_revision: addDays(note.learnedDate, schedule[0]).toISOString(),
      stage: 0,
      forgot_count: 0,
    })
    .select()
    .single()

  if (error) throw error

  const jobs = schedule.map((days, index) => ({
    note_id: data.id,
    scheduled_for: addDays(note.learnedDate, days).toISOString(),
    stage: index,
    sent: false,
  }))

  const { error: jobError } = await supabase.from('revision_jobs').insert(jobs)
  if (jobError) throw jobError

  return data
}

// ── Mark recalled ─────────────────────────────────────────
export async function markRecalled(note: Note): Promise<void> {
  const schedule = REVISION_SCHEDULE[(note.difficulty as Difficulty)] || REVISION_SCHEDULE.medium
  const nextStage = note.stage + 1
  const mastered = nextStage >= schedule.length

  const { error } = await supabase
    .from('notes')
    .update({
      stage: nextStage,
      revision_history: [...(note.revision_history || []), new Date().toISOString()],
      next_revision: mastered
        ? null
        : addDays(new Date(), schedule[nextStage]).toISOString(),
    })
    .eq('id', note.id)

  if (error) throw error
}

// ── Mark forgot ───────────────────────────────────────────
// Resets stage to 0, schedules reminder for tomorrow
export async function markForgot(note: Note): Promise<void> {
  const tomorrow = addDays(new Date(), 1)

  // Reset note back to stage 0
  const { error } = await supabase
    .from('notes')
    .update({
      stage: 0,
      next_revision: tomorrow.toISOString(),
      forgot_count: (note.forgot_count || 0) + 1,
    })
    .eq('id', note.id)

  if (error) throw error

  // Reset ALL revision jobs to unsent and reschedule from tomorrow
  const schedule = REVISION_SCHEDULE[(note.difficulty as Difficulty)] || REVISION_SCHEDULE.medium

  // Delete existing jobs and recreate from tomorrow
  await supabase.from('revision_jobs').delete().eq('note_id', note.id)

  const newJobs = schedule.map((days, index) => ({
    note_id: note.id,
    scheduled_for: addDays(tomorrow, days - 1).toISOString(),
    stage: index,
    sent: false,
  }))

  const { error: jobError } = await supabase.from('revision_jobs').insert(newJobs)
  if (jobError) throw jobError
}

// ── Undo recall ───────────────────────────────────────────
export async function undoRecall(note: Note): Promise<void> {
  if (note.stage === 0) return

  const difficulty = (note.difficulty as Difficulty) || 'medium'
  const schedule = REVISION_SCHEDULE[difficulty]
  const prevStage = note.stage - 1

  const newHistory = [...(note.revision_history || [])]
  newHistory.pop()

  const { error } = await supabase
    .from('notes')
    .update({
      stage: prevStage,
      revision_history: newHistory,
      next_revision: addDays(new Date(), schedule[prevStage]).toISOString(),
    })
    .eq('id', note.id)

  if (error) throw error

  await supabase
    .from('revision_jobs')
    .update({ sent: false, sent_at: null })
    .eq('note_id', note.id)
    .eq('stage', prevStage)
}

// ── Get all notes ─────────────────────────────────────────
export async function getAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ── Get due notes ─────────────────────────────────────────
export async function getDueNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .lte('next_revision', new Date().toISOString())
    .order('next_revision', { ascending: true })

  if (error) throw error
  return data.filter(n => !isMastered(n))
}

// ── Delete note ───────────────────────────────────────────
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

// ── Edit note ─────────────────────────────────────────────
export async function editNote(id: string, updates: {
  title?: string
  summary?: string
  category?: string
  source?: string
  difficulty?: Difficulty
}): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

// ── Snooze note ───────────────────────────────────────────
// Pushes next_revision by 1 day without resetting stage
export async function snoozeNote(note: Note): Promise<void> {
  const tomorrow = addDays(new Date(), 1)

  const { error } = await supabase
    .from('notes')
    .update({ next_revision: tomorrow.toISOString() })
    .eq('id', note.id)

  if (error) throw error

  // Also push the revision_job scheduled_for by 1 day
  await supabase
    .from('revision_jobs')
    .update({ scheduled_for: tomorrow.toISOString() })
    .eq('note_id', note.id)
    .eq('stage', note.stage)
    .eq('sent', false)
}