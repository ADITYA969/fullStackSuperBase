import { supabase } from './supabase'

export const REVISION_DAYS = [1, 3, 7, 14, 21]
export const STAGES = ['Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 21', 'Mastered']

export interface Note {
  id: string
  title: string
  summary: string
  category: string
  source?: string
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
  learnedDate: Date
}): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: note.title,
      summary: note.summary,
      category: note.category,
      source: note.source || null,
      learned_date: note.learnedDate.toISOString(),
      next_revision: addDays(note.learnedDate, REVISION_DAYS[0]).toISOString(),
      stage: 0,
    })
    .select()
    .single()

  if (error) throw error

  const jobs = REVISION_DAYS.map((days, index) => ({
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
  const nextStage = note.stage + 1
  const isMastered = nextStage >= REVISION_DAYS.length

  const { error } = await supabase
    .from('notes')
    .update({
      stage: nextStage,
      revision_history: [...note.revision_history, new Date().toISOString()],
      next_revision: isMastered
        ? null
        : addDays(new Date(), REVISION_DAYS[nextStage]).toISOString(),
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
    .lt('stage', REVISION_DAYS.length)
    .order('next_revision', { ascending: true })

  if (error) throw error
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
