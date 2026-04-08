'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/Nav'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  author_id: string
  title: string
  body: string
  city: string | null
  state: string | null
  created_at: string
  users?: { display_name: string | null; email: string }
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) setAnnouncements(await res.json())
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, body: form.body }),
      })
      if (res.ok) {
        toast.success(editingId ? 'Updated!' : 'Posted!')
        setForm({ title: '', body: '' })
        setShowForm(false)
        setEditingId(null)
        fetchAnnouncements()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch {
      toast.error('Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Deleted')
        fetchAnnouncements()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const startEdit = (a: Announcement) => {
    setForm({ title: a.title, body: a.body })
    setEditingId(a.id)
    setShowForm(true)
  }

  const authorName = (a: Announcement) =>
    a.users?.display_name || a.users?.email?.split('@')[0] || 'Neighbor'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Board</h1>
            <p className="text-gray-500 mt-1">Local announcements from your neighbors</p>
          </div>
          {user && (
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', body: '' }) }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {showForm ? 'Cancel' : '+ Post'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-6 space-y-4">
            <h2 className="font-bold text-lg text-gray-900">{editingId ? 'Edit Post' : 'New Announcement'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
                maxLength={100}
                placeholder="e.g. Big citrus harvest this weekend!"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                required
                rows={4}
                maxLength={500}
                placeholder="Share details with your neighborhood..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Posting...' : (editingId ? 'Update' : 'Post Announcement')}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">📢</div>
            <p className="text-gray-600">No announcements yet.</p>
            {user && <p className="text-sm text-gray-400 mt-2">Be the first to post something!</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                  {user?.id === a.author_id && (
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button onClick={() => startEdit(a)} className="text-xs text-gray-500 hover:text-orange-600">Edit</button>
                      <button onClick={() => handleDelete(a.id)} className="text-xs text-gray-500 hover:text-red-600">Delete</button>
                    </div>
                  )}
                </div>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{a.body}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Posted by {authorName(a)}</span>
                  <span>·</span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  {(a.city || a.state) && (
                    <>
                      <span>·</span>
                      <span>📍 {[a.city, a.state].filter(Boolean).join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
