import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { PickupRequest, Message } from '../types'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchRequests()
  }, [user, navigate])

  useEffect(() => {
    if (selectedRequest) {
      fetchMessages(selectedRequest.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedRequest.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedRequest])

  const fetchRequests = async () => {
    if (!user) return

    try {
      // Fetch outgoing requests (requests I made)
      const { data: outgoing, error: outgoingError } = await supabase
        .from('pickup_requests')
        .select(`
          *,
          listing:listings(
            id,
            fruit_type,
            city,
            state,
            full_address
          )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (outgoingError) {
        console.error('Error fetching outgoing requests:', outgoingError)
      }

      // Fetch incoming requests (requests for my listings)
      const { data: incoming, error: incomingError } = await supabase
        .from('pickup_requests')
        .select(`
          *,
          listing:listings!inner(
            id,
            fruit_type,
            city,
            state,
            full_address,
            user_id
          )
        `)
        .eq('listings.user_id', user.id)
        .order('created_at', { ascending: false })

      if (incomingError) {
        console.error('Error fetching incoming requests:', incomingError)
      }

      // Combine and sort by created_at
      const allRequests = [...(outgoing || []), ...(incoming || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setRequests(allRequests)
      if (allRequests.length > 0) {
        setSelectedRequest(allRequests[0])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('pickup_request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        toast.error('Failed to load messages')
      } else {
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !newMessage.trim() || !user) return

    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        pickup_request_id: selectedRequest.id,
        sender_id: user.id,
        content: newMessage.trim(),
      })

      if (error) {
        toast.error('Failed to send message')
        console.error('Send message error:', error)
      } else {
        setNewMessage('')
        fetchMessages(selectedRequest.id)
        toast.success('Message sent!')
      }
    } catch (error) {
      toast.error('Failed to send message')
      console.error('Send message error:', error)
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header - Integrated Design */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">🍊</span>
              <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
              >
                📊 Dashboard
              </Link>
              <Link
                to="/map"
                className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
              >
                🗺️ Map
              </Link>
              <Link
                to="/messages"
                className="text-orange-600 font-bold border-b-2 border-orange-600"
              >
                💬 Messages
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">💬 Messages</h1>

        {loading ? (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading conversations...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-8xl mb-6">💬</div>
            <p className="text-2xl font-bold text-gray-800 mb-3">No conversations yet</p>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Request pickup from fruit listings to start chatting with fruit sharers!
            </p>
            <Link
              to="/map"
              className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              🍊 Browse Fruit Listings
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Conversations List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <h2 className="font-bold text-lg">💬 Your Conversations</h2>
                <p className="text-sm text-orange-100">{requests.length} conversation{requests.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y divide-gray-200 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 310px)' }}>
                {requests.map((req) => {
                  const listingData = req.listing
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full text-left p-4 hover:bg-orange-50 transition-colors ${
                        selectedRequest?.id === req.id ? 'bg-orange-100 border-l-4 border-orange-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">🍊</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{listingData?.fruit_type}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            📍 {listingData?.city}, {listingData?.state}
                          </p>
                          <span
                            className={`text-xs mt-1 inline-block px-2 py-1 rounded-full font-semibold ${
                              req.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : req.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : req.status === 'declined'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat Area */}
            {selectedRequest && selectedRequest.listing ? (
              <div className="md:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🍊</span>
                    <div>
                      <h2 className="font-bold text-xl">{selectedRequest.listing.fruit_type}</h2>
                      <p className="text-sm text-orange-100">
                        📍 {selectedRequest.listing.city}, {selectedRequest.listing.state}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-orange-50/50 to-yellow-50/50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-gray-700 font-semibold mb-2">No messages yet</p>
                        <p className="text-gray-500 text-sm">Be the first to say hello!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                          <div className="text-xs text-gray-600 mb-1 font-medium px-1">
                            {isMe ? '👤 You' : '👥 Other User'}
                          </div>
                          <div className={`rounded-2xl p-4 max-w-[75%] shadow-md ${
                            isMe
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                              : 'bg-white text-gray-900 border-2 border-gray-200'
                          }`}>
                            <p className="break-words leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-2 ${isMe ? 'text-orange-100' : 'text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t-2 border-orange-200 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="💬 Type your message..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                      {sending ? '📤' : '📨'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="md:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-gray-600">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
