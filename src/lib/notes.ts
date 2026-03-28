import { supabase } from './supabase'

export type Difficulty = 'easy' | 'medium' | 'hard'


export const REVISION_SCHEDULE: Record<Difficulty, number[]> = {
  easy:   [1, 3, 7, 14, 30],
  medium: [1, 2, 5, 7, 14, 21, 30],
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
  created_at: string
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

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

export async function markRecalled(note: Note): Promise<void> {
  const schedule = REVISION_SCHEDULE[(note.difficulty as Difficulty)] || REVISION_SCHEDULE.medium
  const nextStage = note.stage + 1
  const mastered = nextStage >= schedule.length

  const { error } = await supabase
    .from('notes')
    .update({
      stage: nextStage,
      revision_history: [...note.revision_history, new Date().toISOString()],
      next_revision: mastered
        ? null
        : addDays(new Date(), schedule[nextStage]).toISOString(),
    })
    .eq('id', note.id)

  if (error) throw error
}

export async function getAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getDueNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .lte('next_revision', new Date().toISOString())
    .order('next_revision', { ascending: true })

  if (error) throw error
  return data.filter(n => !isMastered(n))
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
