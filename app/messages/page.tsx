'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/Nav'

interface PickupRequest {
  id: string
  listing_id: string
  status: string
  message: string | null
  created_at: string
  requester_id?: string
  listings?: { fruit_type: string; city: string; state: string }
  users?: { id: string; display_name: string | null; email: string }
  _type?: 'incoming' | 'outgoing'
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: { email: string }
}

export default function MessagesPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [acting, setActing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
    fetchRequests()
  }, [])

  useEffect(() => {
    if (selectedRequest) {
      fetchMessages(selectedRequest.id)
      const interval = setInterval(() => fetchMessages(selectedRequest.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedRequest])

  const fetchRequests = async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        fetch('/api/requests?type=incoming'),
        fetch('/api/requests?type=outgoing'),
      ])
      const incoming: PickupRequest[] = incomingRes.ok ? await incomingRes.json() : []
      const outgoing: PickupRequest[] = outgoingRes.ok ? await outgoingRes.json() : []

      const tagged = [
        ...incoming.map(r => ({ ...r, _type: 'incoming' as const })),
        ...outgoing.map(r => ({ ...r, _type: 'outgoing' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setRequests(tagged)
      if (tagged.length > 0) setSelectedRequest(tagged[0])
    } catch {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (requestId: string) => {
    try {
      const res = await fetch(`/api/messages?request_id=${requestId}`)
      if (res.ok) setMessages(await res.json())
    } catch {}
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup_request_id: selectedRequest.id, content: newMessage.trim() }),
      })
      if (res.ok) {
        setNewMessage('')
        fetchMessages(selectedRequest.id)
      } else {
        toast.error('Failed to send message')
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleAction = async (action: 'accepted' | 'declined') => {
    if (!selectedRequest) return
    setActing(true)
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (res.ok) {
        toast.success(action === 'accepted' ? 'Request accepted!' : 'Request declined')
        const updated = { ...selectedRequest, status: action }
        setSelectedRequest(updated)
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: action } : r))
      } else {
        toast.error('Failed to update request')
      }
    } catch {
      toast.error('Failed to update request')
    } finally {
      setActing(false)
    }
  }

  const statusBadge = (status: string) => {
    const cls =
      status === 'accepted' ? 'bg-green-100 text-green-800' :
      status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
      status === 'declined' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl text-gray-600 mb-4">No conversations yet</p>
            <p className="text-gray-500 mb-6">Request a pickup from a listing to start chatting</p>
            <Link href="/map" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Browse Fruit Listings
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-lg">Conversations</h2>
                <p className="text-xs text-gray-500 mt-1">{requests.filter(r => r._type === 'incoming' && r.status === 'pending').length} pending incoming</p>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[520px]">
                {requests.map(req => {
                  const fruit = req.listings?.fruit_type || 'Fruit'
                  const location = req.listings ? `${req.listings.city}, ${req.listings.state}` : ''
                  const isIncoming = req._type === 'incoming'
                  const otherPerson = isIncoming
                    ? (req.users?.display_name || req.users?.email || 'Someone')
                    : 'Your request'
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedRequest?.id === req.id ? 'bg-orange-50 border-l-4 border-orange-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isIncoming ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {isIncoming ? '↙ In' : '↗ Out'}
                            </span>
                            <span className="font-semibold text-gray-900 text-sm truncate">{fruit}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{isIncoming ? `From: ${otherPerson}` : location}</p>
                        </div>
                        {statusBadge(req.status)}
                      </div>
                      {isIncoming && req.status === 'pending' && (
                        <p className="text-xs text-orange-600 font-medium mt-1">⚡ Needs your response</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat */}
            {selectedRequest && (() => {
              const fruit = selectedRequest.listings?.fruit_type || 'Fruit'
              const location = selectedRequest.listings ? `${selectedRequest.listings.city}, ${selectedRequest.listings.state}` : ''
              const isIncoming = selectedRequest._type === 'incoming'
              const otherPerson = isIncoming
                ? (selectedRequest.users?.display_name || selectedRequest.users?.email || 'Someone')
                : location

              return (
                <div className="md:col-span-2 bg-white rounded-lg shadow-md flex flex-col" style={{ height: '600px' }}>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-lg">{fruit}</h2>
                          {statusBadge(selectedRequest.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {isIncoming ? `Request from ${otherPerson}` : `Your request · ${location}`}
                        </p>
                        {selectedRequest.message && (
                          <p className="text-sm text-gray-600 mt-1 italic">"{selectedRequest.message}"</p>
                        )}
                      </div>
                      {/* Accept / Decline for incoming pending */}
                      {isIncoming && selectedRequest.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleAction('accepted')}
                            disabled={acting}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction('declined')}
                            disabled={acting}
                            className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {isIncoming && selectedRequest.status === 'accepted' && (
                        <span className="text-green-600 text-sm font-semibold shrink-0">✓ Accepted</span>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isSent = msg.sender_id === currentUserId
                        return (
                          <div key={msg.id} className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                            {!isSent && <div className="text-xs text-gray-500 mb-1">{msg.sender?.email}</div>}
                            <div className={`rounded-2xl px-4 py-3 max-w-[70%] ${isSent ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${isSent ? 'text-orange-100' : 'text-gray-500'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
