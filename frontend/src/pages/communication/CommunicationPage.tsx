import { useState, useEffect, type FormEvent } from "react"
import { MessageSquare, Send, Users, Loader2, AlertCircle, RefreshCw, X, Plus } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { EmptyState } from "../../components/ui/EmptyState"
import { conversationsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { Conversation, Message } from "../../types"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export function CommunicationPage() {
  const { school, user, membership } = useAuth()
  const schoolId = school!.id
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")

  /* create conversation */
  const [showNewConv, setShowNewConv] = useState(false)
  const [convType, setConvType] = useState<"direct" | "group" | "announcement">("direct")
  const [convSubject, setConvSubject] = useState("")

  const loadConversations = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await conversationsApi.list(schoolId)
      setConversations(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadConversations() }, [schoolId])

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    setError("")
    try {
      const res = await conversationsApi.messages.list(schoolId, conv.id)
      setMessages(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages")
      setMessages([])
    }
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    try {
      await conversationsApi.messages.send(schoolId, selectedConv.id, { content: newMessage })
      setNewMessage("")
      const res = await conversationsApi.messages.list(schoolId, selectedConv.id)
      setMessages(res.data)
      await loadConversations()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleCreateConv = async (e: FormEvent) => {
    e.preventDefault()
    if (!convSubject && convType !== "direct") return
    setSaving(true)
    try {
      const res = await conversationsApi.create(schoolId, {
        type: convType,
        subject: convSubject || undefined,
      })
      setShowNewConv(false)
      setConvType("direct"); setConvSubject("")
      setSelectedConv(res.data)
      setMessages([])
      await loadConversations()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create conversation")
    } finally {
      setSaving(false)
    }
  }

  const convName = (c: Conversation) => {
    if (c.subject) return c.subject
    const names = c.participants
      ?.filter((p) => p.user?.id !== user?.id)
      ?.map((p) => `${p.user?.firstName || ""} ${p.user?.lastName || ""}`)
      .filter(Boolean)
    return names?.length ? names.join(", ") : c.type
  }

  const latestMsg = (c: Conversation) => {
    const msgs = c.messages || []
    return msgs.length > 0 ? msgs[msgs.length - 1] : null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication"
        description="Conversations, announcements, and messaging."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowNewConv(!showNewConv)}>
              <Plus size={16} /> New Conversation
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {showNewConv && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreateConv} className="flex items-end gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Type</label>
                <select value={convType} onChange={(e) => setConvType(e.target.value as any)}
                  className="block rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="direct">Direct</option>
                  <option value="group">Group</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <div className="space-y-1 flex-1">
                <label className="block text-xs font-medium text-surface-700">Subject</label>
                <input type="text" value={convSubject} onChange={(e) => setConvSubject(e.target.value)}
                  placeholder="Conversation subject..." className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowNewConv(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-primary-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={24} className="mx-auto text-primary-300 mb-2" />
                <p className="text-xs text-primary-400">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c) => {
                const lm = latestMsg(c)
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-surface-100 last:border-0 text-left hover:bg-surface-50 transition-colors ${
                      selectedConv?.id === c.id ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 bg-primary-100 text-primary-600">
                      <MessageSquare size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-surface-900 truncate">
                          {convName(c)}
                        </p>
                        <Badge variant="info" className="shrink-0 capitalize text-[9px]">{c.type}</Badge>
                      </div>
                      {lm && (
                        <p className="text-xs text-surface-500 truncate mt-0.5">{lm.content}</p>
                      )}
                      <p className="text-[10px] text-surface-400 mt-1">
                        {lm ? timeAgo(lm.createdAt) : new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Message Area */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          {selectedConv ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-surface-900">{convName(selectedConv)}</h3>
                    <p className="text-xs text-surface-500 capitalize">{selectedConv.type}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={loadConversations}>
                    <RefreshCw size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={30} className="text-surface-300 mb-3" />
                    <p className="text-sm text-surface-500">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?.userId === membership?.userId || msg.senderMembershipId === membership?.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                          isMe ? "bg-accent text-white" : "bg-surface-50 text-surface-900"
                        }`}>
                          {!isMe && (
                            <p className="text-[10px] font-semibold mb-1 opacity-80">
                              {msg.sender?.user?.firstName} {msg.sender?.user?.lastName}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-surface-400"}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
              <div className="p-4 border-t border-surface-100 shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageSquare size={36} className="text-surface-300 mb-3" />
              <h3 className="text-lg font-semibold text-surface-900 mb-1">Select a conversation</h3>
              <p className="text-sm text-surface-500">Choose a conversation from the left or start a new one.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}