import { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare, Send, LifeBuoy, HelpCircle, Lightbulb, ChevronDown, ChevronRight, ArrowLeft, Loader2, X, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Skeleton } from "../../components/ui/Skeleton"
import { platformAdminApi } from "../../lib/api"
import { useWebSocket } from "../../lib/websocket"
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
  open: "bg-green-100 text-green-700 border-green-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-surface-100 text-surface-600 border-surface-200",
  closed: "bg-surface-100 text-surface-400 border-surface-200",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export function SupportPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportTicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params: any = {}
      if (filterCategory) params.category = filterCategory
      if (filterStatus) params.status = filterStatus
      const res = await platformAdminApi.listTickets(params)
      setTickets(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const onSupportTicketNew = useCallback((data: SupportTicket) => {
    setTickets((prev) => prev.some((t) => t.id === data.id) ? prev : [data, ...prev])
  }, [])

  const onSupportMessageNew = useCallback((data: any) => {
    const msg: SupportTicketMessage = data.message
    const ticket: SupportTicket = data.ticket
    if (selectedTicket?.id === ticket.id) {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      setSelectedTicket(ticket)
    }
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, ...ticket } : t))
  }, [selectedTicket])

  const onSupportTicketUpdated = useCallback((data: SupportTicket) => {
    if (selectedTicket?.id === data.id) {
      setSelectedTicket(data)
      if (data.status !== selectedTicket?.status) loadTickets()
    }
    setTickets((prev) => prev.map((t) => t.id === data.id ? { ...t, ...data } : t))
  }, [selectedTicket, loadTickets])

  useWebSocket([], { onTicketNew: onSupportTicketNew, onMessageNew: onSupportMessageNew, onTicketUpdated: onSupportTicketUpdated }, true)

  const refreshTicket = async (ticket: SupportTicket) => {
    try {
      const res = await platformAdminApi.getTicket(ticket.id)
      setSelectedTicket(res.data)
      setMessages(res.data.messages || [])
    } catch { }
  }

  const selectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowMobileDetail(true)
    setError("")
    try {
      const res = await platformAdminApi.getTicket(ticket.id)
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
      const res = await platformAdminApi.sendTicketMessage(selectedTicket.id, { content: newMessage.trim() })
      setMessages((prev) => [...prev, res.data.message])
      setSelectedTicket(res.data.ticket)
      setNewMessage("")
      await loadTickets()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return
    try {
      const res = await platformAdminApi.updateTicketStatus(selectedTicket.id, { status })
      setSelectedTicket(res.data)
      await loadTickets()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  const pendingCount = tickets.filter((t) => t.status === "open").length
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length

  const CategoryIcon = (cat: string) => {
    const Icon = categoryIcons[cat] || MessageSquare
    return <Icon size={12} />
  }

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* Left - Ticket List */}
      <div className={`${showMobileDetail ? "hidden" : "block"} lg:block w-full lg:w-96 shrink-0`}>
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-surface-200 bg-white p-3">
            <p className="text-xs text-surface-500">Open</p>
            <p className="text-xl font-bold text-primary-900">{openCount}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-3">
            <p className="text-xs text-surface-500">Pending</p>
            <p className="text-xl font-bold text-warning-600">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-3">
            <p className="text-xs text-surface-500">Total</p>
            <p className="text-xl font-bold text-primary-900">{tickets.length}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-3">
            <p className="text-xs text-surface-500">Resolved</p>
            <p className="text-xl font-bold text-success-600">{tickets.filter((t) => t.status === "resolved" || t.status === "closed").length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setShowFilters(!showFilters)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors">
            {showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="block rounded-lg border border-surface-200 bg-white px-2 py-1 text-[10px] flex-1">
            <option value="">All Categories</option>
            <option value="query">Query</option>
            <option value="support">Support</option>
            <option value="feedback">Feedback</option>
            <option value="other">Other</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="block rounded-lg border border-surface-200 bg-white px-2 py-1 text-[10px] flex-1">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={loadTickets} disabled={loading} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-1 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center">
              <LifeBuoy size={28} className="mx-auto text-primary-300 mb-3" />
              <p className="text-sm text-primary-400 font-medium">No support tickets</p>
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id
              return (
                <button key={t.id} onClick={() => selectTicket(t)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-surface-50 transition-colors border ${
                    isSelected ? "bg-accent-50 border-accent-200" : "border-transparent"
                  }`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${categoryColors[t.category] || "bg-surface-100"}`}>
                    {CategoryIcon(t.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-surface-900 truncate">{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${statusColors[t.status] || "bg-surface-100 text-surface-600 border-surface-200"}`}>
                        {t.status.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-surface-400 truncate">{t.school?.schoolName}</span>
                    </div>
                    <p className="text-[9px] text-surface-400 mt-0.5">{timeAgo(t.updatedAt)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right - Chat */}
      <div className={`${showMobileDetail ? "block" : "hidden"} lg:block flex-1 min-h-0`}>
        {selectedTicket ? (
          <Card>
            <CardContent className="p-0 flex flex-col h-[70vh]">
              {/* Header */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-surface-100">
                <button onClick={() => { setShowMobileDetail(false); setSelectedTicket(null); setMessages([]) }}
                  className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-surface-100">
                  <ArrowLeft size={20} className="text-surface-600" />
                </button>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${categoryColors[selectedTicket.category] || "bg-surface-100"}`}>
                  {CategoryIcon(selectedTicket.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-surface-500">
                    <span className="capitalize">{selectedTicket.category}</span>
                    <span>&middot;</span>
                    <span>{selectedTicket.school?.schoolName}</span>
                    <span>&middot;</span>
                    <span>by {selectedTicket.creator?.firstName} {selectedTicket.creator?.lastName}</span>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-surface-100 bg-surface-50">
                <span className="text-[10px] font-medium text-surface-600 mr-1">Status:</span>
                {["open", "in_progress", "resolved", "closed"].map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
                      selectedTicket.status === s
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-surface-500 border-surface-200 hover:border-surface-300"
                    }`}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>

              {error && (
                <div className="shrink-0 flex items-center gap-2 bg-danger-50 border-b border-danger-100 px-4 py-2 text-xs text-danger-700">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{error}</span>
                  <button onClick={() => setError("")} className="ml-auto"><X size={12} /></button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-surface-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <LifeBuoy size={30} className="text-surface-300 mb-3" />
                    <p className="text-sm text-surface-500">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromSupport = msg.isFromPlatform
                    return (
                      <div key={msg.id} className={`flex ${isFromSupport ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          isFromSupport ? "bg-[#d9fdd3] text-surface-900" : "bg-white text-surface-900 shadow-sm"
                        }`}>
                          {!isFromSupport && (
                            <p className="text-[10px] font-semibold text-surface-500 mb-0.5">
                              {msg.sender?.firstName} {msg.sender?.lastName}
                              <span className="font-normal text-surface-400 ml-1">(school)</span>
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

              {/* Input */}
              <div className="shrink-0 px-4 py-3 bg-white border-t border-surface-100">
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend(e) } }}
                    placeholder="Reply as platform support... (Ctrl+Enter to send)"
                    rows={1}
                    className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[40px] max-h-24 overflow-y-auto" />
                  <button type="submit" disabled={sending || !newMessage.trim()}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-accent text-white hover:bg-accent-600 disabled:opacity-50 transition-colors shrink-0">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center px-6 bg-white rounded-xl border border-surface-200 p-12">
            <LifeBuoy size={48} className="text-surface-300 mb-4" />
            <h3 className="text-lg font-semibold text-surface-900 mb-1">Support Tickets</h3>
            <p className="text-sm text-surface-500 max-w-sm">
              Select a ticket to view and respond.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
