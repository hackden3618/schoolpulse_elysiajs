import { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare, Send, AlertCircle, Plus, ArrowLeft, LifeBuoy, Filter, X, HelpCircle, Lightbulb } from "lucide-react"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Skeleton } from "../../components/ui/Skeleton"
import { supportApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { useWs } from "../../lib/ws-context"
import type { SupportTicket, SupportTicketMessage } from "../../types"

const categoryIcons: Record<string, typeof HelpCircle> = {
  query: HelpCircle,
  support: LifeBuoy,
  feedback: Lightbulb,
  other: MessageSquare,
}

const categoryColors: Record<string, string> = {
  query: "bg-blue-100 text-blue-700",
  support: "bg-amber-100 text-amber-700",
  feedback: "bg-purple-100 text-purple-700",
  other: "bg-surface-100 text-surface-700",
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-surface-100 text-surface-600",
  closed: "bg-surface-100 text-surface-400",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export function SupportPage() {
  const { school, user } = useAuth()
  const schoolId = school!.id

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportTicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newCategory, setNewCategory] = useState<string>("support")
  const [newBody, setNewBody] = useState("")
  const [creating, setCreating] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const onSupportMessageNew = useCallback((data: any) => {
    const msg: SupportTicketMessage = data.message
    const ticket: SupportTicket = data.ticket
    if (msg.senderId === user?.id) return
    if (selectedTicket?.id === ticket.id) {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      setSelectedTicket(ticket)
    }
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, ...ticket } : t))
  }, [selectedTicket])

  const onTicketUpdated = useCallback((data: SupportTicket) => {
    if (selectedTicket?.id === data.id) setSelectedTicket(data)
    setTickets((prev) => prev.map((t) => t.id === data.id ? { ...t, ...data } : t))
  }, [selectedTicket])

  const onTicketNew = useCallback((data: SupportTicket) => {
    setTickets((prev) => prev.some((t) => t.id === data.id) ? prev : [data, ...prev])
  }, [])

  const { registerCallbacks } = useWs()

  useEffect(() => {
    const uncb = registerCallbacks({ onTicketNew, onMessageNew: onSupportMessageNew, onTicketUpdated })
    return () => uncb()
  }, [onTicketNew, onSupportMessageNew, onTicketUpdated])

  const loadTickets = async () => {
    setLoading(true)
    setError("")
    try {
      const params: any = {}
      if (filterCategory) params.category = filterCategory
      if (filterStatus) params.status = filterStatus
      const res = await supportApi.listTickets(schoolId, params)
      setTickets(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [schoolId, filterCategory, filterStatus])

  const selectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setError("")
    try {
      const res = await supportApi.getTicket(schoolId, ticket.id)
      setMessages(res.data.messages || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages")
      setMessages([])
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    try {
      const res = await supportApi.sendMessage(schoolId, selectedTicket.id, { content: newMessage.trim() })
      setMessages((prev) => prev.some((m) => m.id === res.data.message?.id) ? prev : [...prev, res.data.message])
      setNewMessage("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newBody.trim()) return
    setCreating(true)
    setError("")
    try {
      const res = await supportApi.createTicket(schoolId, { subject: newSubject.trim(), category: newCategory, message: newBody.trim() })
      setTickets((prev) => [res.data, ...prev])
      setShowNewTicket(false)
      setNewSubject("")
      setNewBody("")
      setNewCategory("support")
      selectTicket(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create ticket")
    } finally {
      setCreating(false)
    }
  }

  const CategoryIcon = (cat: string) => {
    const Icon = categoryIcons[cat] || MessageSquare
    return <Icon size={14} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex">
        {/* Left Panel - Ticket List */}
        <div className={`${selectedTicket ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 xl:w-96 shrink-0 min-h-0 border-r border-surface-100 bg-white`}>
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
              <LifeBuoy size={16} className="text-accent" /> Support
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors">
                <Filter size={14} />
              </button>
              <button onClick={() => setShowNewTicket(true)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-50 transition-colors">
                <Plus size={14} /> New
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="shrink-0 px-3 py-2 border-b border-surface-100 bg-surface-50 space-y-1.5">
              <div className="flex gap-2">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="block flex-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-[10px]">
                  <option value="">All Categories</option>
                  <option value="query">Query</option>
                  <option value="support">Support</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="block flex-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-[10px]">
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          )}

          {/* New Ticket Form */}
          {showNewTicket && (
            <div className="shrink-0 border-b border-surface-100 bg-white">
              <form onSubmit={handleCreateTicket} className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-surface-700">New Support Ticket</span>
                  <button type="button" onClick={() => setShowNewTicket(false)} className="p-1 rounded hover:bg-surface-100">
                    <X size={14} className="text-surface-400" />
                  </button>
                </div>
                <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Subject..."
                  className="block w-full rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs" />
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  className="block w-full rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs">
                  <option value="support">Support</option>
                  <option value="query">Query</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
                <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Describe your issue or request..."
                  rows={4}
                  className="block w-full rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs resize-none" />
                <Button size="sm" type="submit" disabled={creating || !newSubject.trim() || !newBody.trim()}>
                  {creating ? "Sending..." : "Submit"}
                </Button>
                {error && <p className="text-[10px] text-danger-500">{error}</p>}
              </form>
            </div>
          )}

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-center">
                <LifeBuoy size={28} className="mx-auto text-primary-300 mb-3" />
                <p className="text-sm text-primary-400 font-medium">No tickets yet</p>
                <p className="text-xs text-surface-400 mt-1">Create a support ticket to get help.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id
                return (
                  <button key={t.id} onClick={() => selectTicket(t)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-surface-50 last:border-0 text-left hover:bg-surface-50 transition-colors ${
                      isSelected ? "bg-accent-50 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"
                    }`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${categoryColors[t.category] || "bg-surface-100"}`}>
                      {CategoryIcon(t.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-surface-900 truncate">{t.subject}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="info" className="text-[9px] capitalize">{t.category}</Badge>
                        <Badge className={`text-[9px] capitalize ${statusColors[t.status] || ""}`}>{t.status.replace("_", " ")}</Badge>
                        {t._count && <span className="text-[10px] text-surface-400">{t._count.messages} msgs</span>}
                      </div>
                      <p className="text-[10px] text-surface-400 mt-0.5">{timeAgo(t.updatedAt)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className={`${selectedTicket ? "flex" : "hidden"} lg:flex flex-1 flex-col min-h-0 bg-white`}>
          {selectedTicket ? (
            <>
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-surface-100 bg-white">
                <button onClick={() => { setSelectedTicket(null); setMessages([]) }}
                  className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-surface-100">
                  <ArrowLeft size={20} className="text-surface-600" />
                </button>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${categoryColors[selectedTicket.category] || "bg-surface-100"}`}>
                  {CategoryIcon(selectedTicket.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900 truncate">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-[9px] capitalize ${statusColors[selectedTicket.status] || ""}`}>{selectedTicket.status.replace("_", " ")}</Badge>
                    <span className="text-[10px] text-surface-400 capitalize">{selectedTicket.category}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="shrink-0 flex items-center gap-2 bg-danger-50 border-b border-danger-100 px-4 py-2 text-xs text-danger-700">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{error}</span>
                  <button onClick={() => setError("")} className="ml-auto p-0.5 rounded hover:bg-danger-100">
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2 bg-surface-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <LifeBuoy size={30} className="text-surface-300 mb-3" />
                    <p className="text-sm text-surface-500">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={`flex ${isMe && !msg.isFromPlatform ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          msg.isFromPlatform ? "bg-accent-50 border border-accent-100 text-surface-900"
                            : isMe ? "bg-[#d9fdd3] text-surface-900"
                            : "bg-white text-surface-900 shadow-sm"
                        }`}>
                          {msg.isFromPlatform && (
                            <p className="text-[10px] font-semibold text-accent mb-0.5">Platform Support</p>
                          )}
                          {!isMe && !msg.isFromPlatform && (
                            <p className="text-[10px] font-semibold text-surface-500 mb-0.5">
                              {msg.sender?.firstName} {msg.sender?.lastName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className="text-[10px] text-surface-400 text-right mt-0.5">{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 px-4 py-3 bg-white border-t border-surface-100">
                {selectedTicket.status === "closed" ? (
                  <div className="flex items-center gap-3 rounded-lg bg-surface-50 border border-surface-200 px-4 py-2.5">
                    <span className="text-sm text-surface-500 flex-1">This ticket is closed. Reply to reopen it.</span>
                  </div>
                ) : null}
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend(e) } }}
                    placeholder={selectedTicket.status === "closed" ? "Type a message to reopen..." : "Type your reply... (Ctrl+Enter to send)"}
                    rows={1}
                    disabled={sending}
                    className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[40px] max-h-24 overflow-y-auto disabled:opacity-50" />
                  <button type="submit" disabled={sending || !newMessage.trim()}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-accent text-white hover:bg-accent-600 disabled:opacity-50 transition-colors shrink-0">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center px-6 bg-surface-50">
              <LifeBuoy size={48} className="text-surface-300 mb-4" />
              <h3 className="text-lg font-semibold text-surface-900 mb-1">SchoolPulse Support</h3>
              <p className="text-sm text-surface-500 max-w-sm">
                Select a ticket from the left panel or create a new one to get help from the platform team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
