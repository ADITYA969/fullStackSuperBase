import { useState } from 'react'
import Dashboard from './components/Dashboard'
import AddNote from './components/AddNote'
import AllNotes from './components/AllNotes'
import styles from './App.module.css'

export type Tab = 'dashboard' | 'add' | 'all'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Recall</div>
        <div className={styles.tagline}>Spaced Repetition · Long-term Memory</div>
      </header>

      <nav className={styles.tabs}>
        {(['dashboard', 'add', 'all'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'add' && '+ Add Note'}
            {tab === 'all' && '📚 All Notes'}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'dashboard' && <Dashboard onAddNote={() => setActiveTab('add')} />}
        {activeTab === 'add' && <AddNote onSaved={() => setActiveTab('dashboard')} />}
        {activeTab === 'all' && <AllNotes />}
      </main>
    </div>
  )
}
