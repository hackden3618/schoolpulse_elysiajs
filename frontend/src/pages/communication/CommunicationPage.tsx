import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { MessageSquare, Send, AlertCircle, RefreshCw, X, Plus, CheckCheck, Check, XCircle, Clock, Megaphone, ArrowLeft, Users, Smartphone, ChevronDown, ChevronRight, UserCheck, Trash2, MoreVertical, Pencil } from "lucide-react"
import { Card } from "../../components/ui/Card"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Skeleton } from "../../components/ui/Skeleton"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { withMinDelay } from "../../lib/ux"
import { conversationsApi, smsApi, membershipsApi, studentsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { useWs } from "../../lib/ws-context"
import { useUnread } from "../../lib/unread-context"
import type { Conversation, Message, SmsTemplate, Student, Guardian } from "../../types"

const OPTOUT_CHARS = 15

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return formatTime(dateStr)
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function DeliveryIcon({ msg }: { msg: Message }) {
  const receipts = msg.receipts || []
  const failed = receipts.filter((r) => r.status === "failed")
  const read = receipts.filter((r) => r.status === "read")
  const delivered = receipts.filter((r) => r.status === "delivered")
  const sent = receipts.filter((r) => r.status === "sent")
  if (failed.length > 0) return <XCircle size={12} className="text-danger-500" />
  if (read.length > 0) return <span className="flex items-center" style={{ color: "#53bdeb" }}><CheckCheck size={12} /></span>
  if (delivered.length > 0) return <CheckCheck size={12} className="text-surface-400" />
  if (sent.length > 0) return <Check size={12} className="text-surface-400" />
  return <Clock size={12} className="text-surface-400" />
}

interface GuardianEntry {
  userId: string
  name: string
  phone: string
  relationship: string
  isPrimary: boolean
}

interface StaffEntry {
  userId: string
  name: string
  phone: string
  role: string
}

function calcSegmentInfo(text: string): { charCount: number; segmentCount: number; perSegmentMax: number; remaining: number } {
  const charCount = text.length
  const SINGLE_MAX = 160
  const CONCAT_MAX = 153
  let segments: number
  if (charCount <= SINGLE_MAX) segments = 1
  else segments = Math.ceil(charCount / CONCAT_MAX)
  const maxChars = segments === 1 ? SINGLE_MAX : segments * CONCAT_MAX
  return {
    charCount,
    segmentCount: segments,
    perSegmentMax: segments === 1 ? SINGLE_MAX : CONCAT_MAX,
    remaining: Math.max(0, maxChars - charCount),
  }
}


function countUnread(conversations: Conversation[], currentUserId?: string): number {
  let count = 0
  for (const c of conversations) {
    if (hasUnread(c, currentUserId)) count++
  }
  return count
}

function hasUnread(conv: Conversation, currentUserId?: string): boolean {
  if (!currentUserId) return false
  return (conv.messages || []).some(
    (m) => m.sender?.userId !== currentUserId
      && !m.receipts?.some((r) => r.recipientUserId === currentUserId && r.status === "read")
  )
}

export function CommunicationPage() {
  const { school, user, membership } = useAuth()
  const schoolId = school!.id
  const { unreadCount, increment, decrement, reset: resetUnread } = useUnread()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [messageChannel, setMessageChannel] = useState<"in_app" | "sms">("in_app")

  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])
  const [smsTemplatesLoading, setSmsTemplatesLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")

  const [staffMembers, setStaffMembers] = useState<StaffEntry[]>([])
  const [guardianEntries, setGuardianEntries] = useState<GuardianEntry[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set())
  const [recipientsLoading, setRecipientsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const selectedConvRef = useRef<Conversation | null>(null)
  useEffect(() => { selectedConvRef.current = selectedConv }, [selectedConv])

  const [showNewConv, setShowNewConv] = useState(false)
  const [convType, setConvType] = useState<"direct" | "group" | "announcement">("direct")
  const [convSubject, setConvSubject] = useState("")
  const [convParticipantIds, setConvParticipantIds] = useState<Set<string>>(new Set())
  const [convError, setConvError] = useState("")
  const [creatingConv, setCreatingConv] = useState(false)

  const [menuConvId, setMenuConvId] = useState<string | null>(null)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const [typingUsers, setTypingUsers] = useState<Map<string, { displayName: string; lastTypedAt: number }>>(new Map())
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const lastTypingEmitRef = useRef(0)

  const onNewMessage = useCallback((msg: Message) => {
    setConversations((prev) => prev.map((c) => {
      if (c.id === msg.conversationId) return { ...c, messages: [{ ...msg, isLatest: true }, ...c.messages.slice(0, 0)] }
      return c
    }))
    if (selectedConvRef.current?.id === msg.conversationId) {
      if (msg.sender?.userId !== user?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        markRead(msg.id, schoolId)
      }
    } else if (msg.sender?.userId !== user?.id) {
      increment()
    }
  }, [])

  const onReceiptUpdate = useCallback((msg: Message) => {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? msg : m))
  }, [])

  const onDeleteMessage = useCallback((data: { messageId: string }) => {
    setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
  }, [])

  const onMessageUpdated = useCallback((msg: Message) => {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? msg : m))
    setConversations((prev) => prev.map((c) => {
      if (c.id === msg.conversationId) return { ...c, messages: c.messages.map((lm) => lm.id === msg.id ? { ...lm, content: msg.content } : lm) }
      return c
    }))
  }, [])

  const wsSubs = conversations.map((c) => ({
    conversationId: c.id,
    onMessage: onNewMessage,
    onReceiptUpdate,
    onDelete: onDeleteMessage,
    onMessageUpdated,
  }))

  const handleConversationCreated = useCallback((data: Conversation) => {
    setConversations((prev) => prev.some((c) => c.id === data.id) ? prev : [data, ...prev])
  }, [])

  const handleTyping = useCallback((data: { conversationId: string; userId: string; displayName: string; typing: boolean }) => {
    if (data.conversationId !== selectedConvRef.current?.id) return
    if (data.userId === user?.id) return
    setTypingUsers((prev) => {
      const next = new Map(prev)
      if (data.typing) {
        next.set(data.userId, { displayName: data.displayName, lastTypedAt: Date.now() })
      } else {
        next.delete(data.userId)
      }
      return next
    })
  }, [])

  const { subscribe, markRead, send, registerSubscriptions, registerCallbacks } = useWs()

  useEffect(() => {
    const unsub = registerSubscriptions(wsSubs)
    const uncb = registerCallbacks({ onConversationCreated: handleConversationCreated, onTyping: handleTyping })
    return () => { unsub(); uncb() }
  }, [wsSubs, handleConversationCreated, handleTyping])

  const emitTyping = useCallback((typing: boolean) => {
    if (!selectedConvRef.current) return
    const now = Date.now()
    if (typing && now - lastTypingEmitRef.current < 3000) return
    lastTypingEmitRef.current = typing ? now : 0
    send({
      event: typing ? "typing:start" : "typing:stop",
      data: {
        conversationId: selectedConvRef.current.id,
        displayName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      },
    })
  }, [])

  useEffect(() => {
    typingIntervalRef.current = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now()
        const next = new Map(prev)
        for (const [id, u] of next) {
          if (now - u.lastTypedAt > 4000) next.delete(id)
        }
        return next.size === prev.size ? prev : next
      })
    }, 1000)
    return () => { clearInterval(typingIntervalRef.current) }
  }, [])

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }, [messages])

  const segmentInfo = messageChannel === "sms" && newMessage.trim() ? calcSegmentInfo(newMessage) : null
  const effectivePerSegment = segmentInfo ? segmentInfo.perSegmentMax - OPTOUT_CHARS : 0
  const effectiveMax = segmentInfo ? (segmentInfo.segmentCount === 1 ? effectivePerSegment : (segmentInfo.segmentCount * (segmentInfo.perSegmentMax - OPTOUT_CHARS))) : 0

  const loadConversations = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await withMinDelay(conversationsApi.list(schoolId))
      setConversations(res.data)
      reset()
      const count = countUnread(res.data, user?.id)
      if (count > 0) increment(count)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  const loadSmsTemplates = async () => {
    setSmsTemplatesLoading(true)
    try {
      const res = await smsApi.templates.list(schoolId)
      setSmsTemplates(res.data)
    } catch { /* ignore */ } finally {
      setSmsTemplatesLoading(false)
    }
  }

  const loadRecipients = async () => {
    setRecipientsLoading(true)
    try {
      const [membersRes, studentsRes] = await Promise.all([
        membershipsApi.list(schoolId),
        studentsApi.list(schoolId).catch(() => ({ data: [] as Student[] })),
      ])

      const staff: StaffEntry[] = []
      for (const m of membersRes.data) {
        const name = `${m.user.firstName} ${m.user.lastName || ""}`.trim()
        const phone = m.user.phone
        if (!phone) continue
        const roles = m.roles.map((r: any) => r.role?.name).filter(Boolean)
        staff.push({ userId: m.userId, name, phone, role: roles.length ? roles.join(", ") : "Staff" })
      }
      setStaffMembers(staff)

      const guardianMap = new Map<string, GuardianEntry>()
      const students = studentsRes.data || []
      for (const student of students) {
        const gs = student.guardians || []
        for (const g of gs) {
          const uid = g.guardian?.id
          if (!uid || !g.guardian?.phone) continue
          const existing = guardianMap.get(uid)
          if (existing) {
            if (g.isPrimary) existing.isPrimary = true
          } else {
            guardianMap.set(uid, {
              userId: uid,
              name: `${g.guardian.firstName} ${g.guardian.lastName || ""}`.trim(),
              phone: g.guardian.phone,
              relationship: g.relationship,
              isPrimary: g.isPrimary,
            })
          }
        }
      }

      const allGuardians = Array.from(guardianMap.values())
      setGuardianEntries(allGuardians)

      const primaryIds = allGuardians.filter((g) => g.isPrimary).map((g) => g.userId)
      setSelectedRecipientIds(new Set(primaryIds))
    } catch { /* ignore */ } finally {
      setRecipientsLoading(false)
    }
  }

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      loadConversations()
      loadSmsTemplates()
    }
  }, [schoolId])

  useEffect(() => {
    if (messageChannel === "sms" && schoolId && selectedConv) {
      loadRecipients()
    }
  }, [messageChannel, schoolId, selectedConv?.id])

  useEffect(() => {
    if (!menuConvId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-menu]")) setMenuConvId(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuConvId])

  const handleDeleteMsg = async (msgId: string) => {
    try {
      await conversationsApi.messages.delete(schoolId, msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete message")
    }
  }

  const handleDeleteConv = async (convId: string) => {
    try {
      await conversationsApi.delete(schoolId, convId)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (selectedConv?.id === convId) setSelectedConv(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete conversation")
    }
    setMenuConvId(null)
  }

  const handleEditMessage = async (msgId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await conversationsApi.messages.edit(schoolId, msgId, { content: editContent.trim() })
      setMessages((prev) => prev.map((m) => m.id === msgId ? res.data : m))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to edit message")
    }
    setEditingMsgId(null)
    setEditContent("")
  }

  const handleEditCancel = () => {
    setEditingMsgId(null)
    setEditContent("")
  }

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    setMessageChannel("in_app")
    setError("")
    try {
      const res = await conversationsApi.messages.list(schoolId, conv.id)
      setMessages(res.data)
      subscribe(conv.id)
      // Mark unread messages as read
      const otherMessages = res.data.filter(
        (m) => m.sender?.userId !== user?.id && m.senderMembershipId !== membership?.id
          && !m.receipts?.some((r) => r.recipientUserId === user?.id && r.status === "read")
      )
      for (const msg of otherMessages) markRead(msg.id, schoolId)
      if (otherMessages.length > 0) decrement(otherMessages.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages")
      setMessages([])
    }
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    const content = newMessage.trim()
    if (!content || !selectedConv) return
    setSending(true)
    try {
      if (messageChannel === "sms") {
        const recipientPhones = Array.from(selectedRecipientIds)
          .map((id) => {
            const s = staffMembers.find((s) => s.userId === id)
            if (s) return s.phone
            const g = guardianEntries.find((g) => g.userId === id)
            if (g) return g.phone
            return null
          })
          .filter(Boolean) as string[]

        if (recipientPhones.length === 0) {
          setError("No recipients selected")
          setSending(false)
          return
        }
        const res = await conversationsApi.messages.send(schoolId, selectedConv.id, {
          content,
          channel: "sms",
          recipientPhones,
        })
        if (res?.data) {
          setMessages((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]))
        }
      } else {
        const res = await conversationsApi.messages.send(schoolId, selectedConv.id, {
          content,
          channel: messageChannel,
        })
        // Add the returned message directly to state
        if (res?.data) {
          setMessages((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]))
        }
      }
      setNewMessage("")
      emitTyping(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleCreateConv = async (e: FormEvent) => {
    e.preventDefault()
    setConvError("")

    if (!convSubject && convType !== "direct") {
      setConvError("Subject is required for group and announcement conversations.")
      return
    }

    if (convParticipantIds.size === 0) {
      setConvError("Select at least one recipient.")
      return
    }

    setCreatingConv(true)
    try {
      const res = await conversationsApi.create(schoolId, {
        type: convType,
        subject: convSubject || undefined,
        participantIds: Array.from(convParticipantIds),
      })
      setShowNewConv(false)
      setConvType("direct"); setConvSubject(""); setConvParticipantIds(new Set())
      setConvError("")
      setSelectedConv(res.data)
      setMessages([])
      subscribe(res.data.id)
      await loadConversations()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create conversation")
    } finally {
      setCreatingConv(false)
    }
  }

  const toggleRecipient = (userId: string) => {
    setSelectedRecipientIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
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
    return msgs.length > 0 ? msgs[0] : null
  }

  const showMobileChat = selectedConv !== null

  const selectedCount = selectedRecipientIds.size

  const renderSmsCompose = () => {
    if (messageChannel !== "sms" || !selectedConv) return null

    return (
      <form onSubmit={handleSend} className="shrink-0 border-t border-surface-100 bg-white">
        <div className="px-4 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
          {/* Recipient Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
                <Users size={12} /> Recipients {selectedCount > 0 && <span className="text-accent font-medium">({selectedCount})</span>}
              </span>
            </div>
            {recipientsLoading ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const roleGroups = new Map<string, typeof staffMembers>()
                  for (const s of staffMembers) {
                    const roles = s.role ? s.role.split(",").map((r) => r.trim()).filter(Boolean) : ["Staff"]
                    for (const role of roles) {
                      if (!roleGroups.has(role)) roleGroups.set(role, [])
                      roleGroups.get(role)!.push(s)
                    }
                  }
                  const groups: { label: string; members: { userId: string }[] }[] = []
                  for (const [role, members] of roleGroups) {
                    groups.push({ label: role, members })
                  }
                  if (guardianEntries.length > 0) {
                    groups.push({ label: "Guardians", members: guardianEntries })
                  }
                  return groups.map(({ label, members }) => {
                    const selected = members.filter((m) => selectedRecipientIds.has(m.userId)).length
                    const allSelected = selected === members.length
                    return (
                      <button key={label} type="button"
                        onClick={() => {
                          for (const m of members) {
                            if (allSelected && selectedRecipientIds.has(m.userId)) toggleRecipient(m.userId)
                            else if (!allSelected && !selectedRecipientIds.has(m.userId)) toggleRecipient(m.userId)
                          }
                        }}
                        className={`text-[10px] rounded-full px-2.5 py-1 border transition-colors ${
                          allSelected ? "bg-accent text-white border-accent"
                            : selected > 0 ? "bg-accent-50 text-accent border-accent-200"
                            : "bg-white text-surface-500 border-surface-200 hover:border-surface-300"
                        }`}>
                        {label} ({selected}/{members.length})
                      </button>
                    )
                  })
                })()}
              </div>
            )}
          </div>

          {/* Templates */}
          <div>
            <button type="button" onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 text-xs font-medium text-surface-600 mb-1">
              {showTemplates ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Templates ({smsTemplates.length})
            </button>
            {showTemplates && (
              <div className="flex gap-1.5 flex-wrap">
                {smsTemplatesLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : smsTemplates.length === 0 ? (
                  <span className="text-[10px] text-surface-400">No saved templates.</span>
                ) : (
                  smsTemplates.map((t) => (
                    <button key={t.id} type="button" onClick={() => setNewMessage(t.message)}
                      className="text-[10px] bg-surface-50 border border-surface-200 rounded-full px-2.5 py-1 text-surface-600 hover:bg-surface-100 transition-colors">
                      {t.name}
                    </button>
                  ))
                )}
                <button type="button" onClick={() => { setTemplateName(""); setShowSaveTemplate(true) }}
                  disabled={!newMessage.trim()}
                  className="text-[10px] border border-dashed border-surface-300 rounded-full px-2.5 py-1 text-accent hover:bg-accent-50 transition-colors disabled:opacity-40">
                  <Plus size={10} className="inline mr-0.5" />Save
                </button>
              </div>
            )}
          </div>

          {/* SMS Message Input and Metrics */}
          <div className="space-y-1.5">
            <textarea value={newMessage} onChange={(e) => { setNewMessage(e.target.value); emitTyping(true) }}
              placeholder="Compose SMS message..."
              rows={3}
              className="block w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
            {segmentInfo && (
              <div className="flex items-center gap-3 text-[10px] text-surface-500 flex-wrap">
                <span className="font-medium text-surface-700">
                  {segmentInfo.charCount}/{effectivePerSegment} characters
                  <span className="font-normal text-surface-400 ml-1">(+{OPTOUT_CHARS} opt-out)</span>
                </span>
                <span className="text-surface-300">|</span>
                <span>Encoding: GSM_7BIT</span>
                <span className="text-surface-300">|</span>
                <span>Per msg: {segmentInfo.perSegmentMax}</span>
                <span className="text-surface-300">|</span>
                <span className={segmentInfo.segmentCount > 1 ? "text-warning-600 font-medium" : ""}>
                  {segmentInfo.segmentCount} segment{segmentInfo.segmentCount > 1 ? "s" : ""}
                  {segmentInfo.segmentCount > 1 && <span className="text-surface-400 ml-1">(concatenated)</span>}
                </span>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex gap-2">
            <button type="submit" disabled={sending || !newMessage.trim() || selectedCount === 0}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {sending ? "Sending..." : <><Smartphone size={14} /> Send SMS ({selectedCount} recipient{selectedCount !== 1 ? "s" : ""})</>}
            </button>
            <button type="button" onClick={() => setMessageChannel("in_app")}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </form>
    )
  }

  const toggleConvParticipant = (userId: string) => {
    setConvParticipantIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    if (convType === "announcement") setConvType("group")
    if (convError) setConvError("")
  }

  const renderNewConvDialog = () => (
    <div className="shrink-0 border-b border-surface-100 bg-white">
      <form onSubmit={handleCreateConv} className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-700">New Conversation</span>
          <button type="button" onClick={() => { setShowNewConv(false); setConvError("") }} className="p-1 rounded hover:bg-surface-100">
            <X size={14} className="text-surface-400" />
          </button>
        </div>

        <div className="flex gap-2">
          <select value={convType} onChange={(e) => { 
            const newType = e.target.value as any
            setConvType(newType)
            if (newType === "announcement") {
              setConvParticipantIds(new Set([...staffMembers.map((s) => s.userId), ...guardianEntries.map((g) => g.userId)]))
            }
            setConvError("")
          }}
            className="block rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs flex-1">
            <option value="direct">Direct</option>
            <option value="group">Group</option>
            <option value="announcement">Announcement</option>
          </select>
          <Button size="sm" type="submit" disabled={creatingConv}>{creatingConv ? "..." : "Create"}</Button>
        </div>

        <input type="text" value={convSubject} onChange={(e) => { setConvSubject(e.target.value); if (convError) setConvError("") }}
          placeholder="Subject (required for group/announcement)..."
          className="block w-full rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs" />

        {/* Participant Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-surface-600">
              Recipients ({convParticipantIds.size})
            </span>
            {recipientsLoading && <span className="text-[9px] text-surface-400">Loading...</span>}
          </div>
          {staffMembers.length === 0 && guardianEntries.length === 0 && !recipientsLoading ? (
            <p className="text-[10px] text-surface-400 py-1">No recipients available.</p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-0.5 border border-surface-100 rounded-lg p-1.5">
              {staffMembers.map((s) => (
                <label key={s.userId} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-surface-50 cursor-pointer">
                  <input type="checkbox" checked={convParticipantIds.has(s.userId)}
                    onChange={() => toggleConvParticipant(s.userId)}
                    className="h-3 w-3 rounded border-surface-300 text-accent focus:ring-accent" />
                  <span className="text-[10px] text-surface-700 truncate flex-1">{s.name}</span>
                  <span className="text-[9px] text-surface-400 shrink-0">{s.role?.split(",")[0]}</span>
                </label>
              ))}
              {guardianEntries.map((g) => (
                <label key={g.userId} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-surface-50 cursor-pointer">
                  <input type="checkbox" checked={convParticipantIds.has(g.userId)}
                    onChange={() => toggleConvParticipant(g.userId)}
                    className="h-3 w-3 rounded border-surface-300 text-accent focus:ring-accent" />
                  <span className="text-[10px] text-surface-700 truncate flex-1">{g.name}</span>
                  <span className="text-[9px] text-surface-400 capitalize shrink-0">{g.relationship}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {convError && (
          <div className="flex items-center gap-1.5 rounded bg-danger-50 border border-danger-100 px-2.5 py-1.5">
            <AlertCircle size={12} className="text-danger-500 shrink-0" />
            <span className="text-[10px] text-danger-700">{convError}</span>
          </div>
        )}
      </form>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex">
        {/* Left Panel */}
        <div className={`${showMobileChat ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 xl:w-96 shrink-0 min-h-0 border-r border-surface-100 bg-white`}>
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-surface-900">Chats</h2>
            <button onClick={() => {
              if (!showNewConv) {
                setConvError("")
                setConvParticipantIds(new Set())
                setConvSubject("")
                if (staffMembers.length === 0 && guardianEntries.length === 0) loadRecipients()
              }
              setShowNewConv(true)
            }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-50 transition-colors">
              <Plus size={14} /> New
            </button>
          </div>

          {showNewConv && renderNewConvDialog()}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={28} className="mx-auto text-primary-300 mb-3" />
                <p className="text-sm text-primary-400 font-medium">No conversations yet</p>
                <p className="text-xs text-surface-400 mt-1">Start a new conversation to begin messaging.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const lm = latestMsg(c)
                const unread = hasUnread(c, user?.id)
                return (
                  <div key={c.id} className="relative group">
                    <button onClick={() => selectConversation(c)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-surface-50 last:border-0 text-left hover:bg-surface-50 transition-colors ${
                        selectedConv?.id === c.id ? "bg-accent-50 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"
                      } ${unread ? "bg-surface-50/70" : ""}`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                        c.type === "announcement" ? "bg-accent-50 text-accent" : "bg-primary-100 text-primary-600"
                      }`}>
                        {c.type === "announcement" ? <Megaphone size={16} /> : <MessageSquare size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${unread ? "font-bold text-surface-950" : "font-semibold text-surface-900"}`}>{convName(c)}</p>
                          {unread && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                          <Badge variant={c.type === "announcement" ? "warning" : "info"} className="shrink-0 capitalize text-[9px]">{c.type}</Badge>
                        </div>
                        {lm && <p className={`text-xs truncate mt-0.5 ${unread ? "font-semibold text-surface-700" : "text-surface-500"}`}>{lm.content}</p>}
                        <p className="text-[10px] text-surface-400 mt-1">{lm ? timeAgo(lm.createdAt) : formatDate(c.createdAt)}</p>
                      </div>
                    </button>
                    <button data-menu onClick={(e) => { e.stopPropagation(); setMenuConvId(menuConvId === c.id ? null : c.id) }}
                      className="absolute top-3 right-2 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-surface-200 transition-all text-surface-400">
                      <MoreVertical size={14} />
                    </button>
                    {menuConvId === c.id && (
                      <div data-menu className="absolute right-2 top-10 z-50 w-40 bg-white rounded-lg shadow-lg border border-surface-100 py-1">
                        <button onClick={() => handleDeleteConv(c.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger-600 hover:bg-danger-50 transition-colors">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={`${showMobileChat ? "flex" : "hidden"} lg:flex flex-1 flex-col min-h-0 bg-white`}>
          {selectedConv ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-surface-100 bg-white">
                <button onClick={() => { setSelectedConv(null); setMessageChannel("in_app") }}
                  className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-surface-100 transition-colors">
                  <ArrowLeft size={20} className="text-surface-600" />
                </button>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                  selectedConv.type === "announcement" ? "bg-accent-50 text-accent" : "bg-primary-100 text-primary-600"
                }`}>
                  {selectedConv.type === "announcement" ? <Megaphone size={16} /> : <MessageSquare size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900 truncate">{convName(selectedConv)}</h3>
                  <p className="text-[11px] text-surface-500 capitalize">
                    {selectedConv.type} &middot; {selectedConv.participants?.length || 0} participants
                  </p>
                </div>
                <button onClick={() => { loadConversations(); conversationsApi.messages.list(schoolId, selectedConv.id).then((r) => setMessages(r.data)).catch(() => {}) }}
                  className="p-2 rounded-lg hover:bg-surface-100 transition-colors" title="Refresh">
                  <RefreshCw size={14} className="text-surface-500" />
                </button>
              </div>

              {/* Error banner */}
              {error && (
                <div className="shrink-0 flex items-center gap-2 bg-danger-50 border-b border-danger-100 px-4 py-2 text-xs text-danger-700">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{error}</span>
                  <button onClick={() => setError("")} className="ml-auto p-0.5 rounded hover:bg-danger-100">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-1 bg-[#e5ddd5]"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={30} className="text-surface-300 mb-3" />
                    <p className="text-sm text-surface-500 bg-white/80 px-4 py-2 rounded-lg">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const prevMsg = idx > 0 ? messages[idx - 1] : null
                      const isMe = msg.sender?.userId === user?.id || msg.senderMembershipId === membership?.id
                      const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()
const receipts = msg.receipts || []
const failedCount = receipts.filter((r) => r.status === "failed").length
const deliveredCount = receipts.filter((r) => r.status === "delivered" || r.status === "read").length
const sentCount = receipts.filter((r) => r.status === "sent").length
const total = receipts.length
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="text-[11px] text-surface-500 bg-white/80 shadow-sm px-3 py-1 rounded-full font-medium">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group`}>
                            <div className={`relative max-w-[75%] min-w-[120px] rounded-lg px-3 py-2 ${
                              isMe ? "bg-[#d9fdd3] text-surface-900" : "bg-white text-surface-900 shadow-sm"
                            }`}>
                              {isMe && (
                                <button onClick={() => handleDeleteMsg(msg.id)}
                                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-surface-200 transition-all text-surface-400 hover:text-danger-500"
                                  title="Delete message">
                                  <Trash2 size={12} />
                                </button>
                              )}
                              {isMe && msg.channel === "in_app" && Date.now() - new Date(msg.createdAt).getTime() < 30 * 60 * 1000 && editingMsgId !== msg.id && (
                                <button onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content || "") }}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-surface-200 transition-all text-surface-400 hover:text-accent"
                                  title="Edit message">
                                  <Pencil size={12} />
                                </button>
                              )}
                              {!isMe && (
                                <p className="text-[10px] font-semibold mb-0.5 text-accent">
                                  {msg.sender?.user?.firstName} {msg.sender?.user?.lastName}
                                </p>
                              )}
                              {msg.channel === "sms" && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-surface-400 mb-0.5">
                                  <Smartphone size={9} /> SMS
                                </span>
                              )}
                              {editingMsgId === msg.id ? (
                                <div className="space-y-1">
                                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                    autoFocus
                                    rows={2}
                                    className="w-full rounded border border-accent bg-white px-2 py-1 text-sm resize-none focus:outline-none"
                                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleEditMessage(msg.id) } }} />
                                  <div className="flex gap-1 justify-end">
                                    <button onClick={() => handleEditMessage(msg.id)} disabled={!editContent.trim()}
                                      className="text-[10px] bg-accent text-white px-2 py-1 rounded hover:bg-accent-600 disabled:opacity-40 transition-colors">
                                      <Check size={10} className="inline mr-0.5" />Save
                                    </button>
                                    <button onClick={handleEditCancel}
                                      className="text-[10px] bg-surface-100 text-surface-600 px-2 py-1 rounded hover:bg-surface-200 transition-colors">
                                      <X size={10} className="inline mr-0.5" />Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content?.trim()}</p>
                                  {msg.updatedAt !== msg.createdAt && (
                                    <span className="text-[9px] text-surface-400 italic">edited</span>
                                  )}
                                </>
                              )}
                              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                <span className="text-[10px] text-surface-400">{formatTime(msg.createdAt)}</span>
                                {(isMe || receipts.length > 0) && <DeliveryIcon msg={msg} />}
                              </div>
                            </div>
                          </div>
                          {receipts.length > 0 && (
                            <div className={`flex ${isMe ? "justify-end" : "justify-start"} mr-1 mb-1`}>
                              <div className="flex items-center gap-1.5 text-[9px] text-surface-400">
                                {sentCount > 0 && <span>{sentCount} sent</span>}
                                {deliveredCount > 0 && <span className="text-success-600">{deliveredCount} delivered</span>}
                                {failedCount > 0 && <span className="text-danger-500">{failedCount} failed</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {typingUsers.size > 0 && (
                <div className="shrink-0 px-4 py-1.5 border-t border-surface-100 bg-white/80">
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <div className="typing-dots flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>
                      {Array.from(typingUsers.values()).map((u) => u.displayName).join(", ")}
                      {typingUsers.size === 1 ? " is typing..." : " are typing..."}
                    </span>
                  </div>
                </div>
              )}

              {/* SMS Compose (when SMS channel is active) */}
              {renderSmsCompose()}

              {/* In-App Message Input (when in_app channel) */}
              {messageChannel === "in_app" && (
                <div className="shrink-0 px-4 py-3 bg-white border-t border-surface-100">
                  <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <select value={messageChannel} onChange={(e) => { setMessageChannel(e.target.value as any); emitTyping(false) }}
                      className="rounded-lg border border-surface-200 bg-white px-2 py-2.5 text-xs shrink-0">
                      <option value="in_app">In-App</option>
                      <option value="sms">SMS</option>
                    </select>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); emitTyping(true) }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault()
                            handleSend(e)
                          }
                        }}
                        placeholder="Type a message... (Ctrl+Enter to send)"
                        rows={1}
                        className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[40px] max-h-24 overflow-y-auto"
                      />
                      <button type="submit" disabled={sending || !newMessage.trim()}
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-accent text-white hover:bg-accent-600 disabled:opacity-50 transition-colors shrink-0" title="Send">
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Channel Switcher at bottom when SMS compose is shown */}
              {messageChannel === "sms" && (
                <div className="shrink-0 px-4 py-2 bg-surface-50 border-t border-surface-100 flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">Sending via SMS</span>
                  <button onClick={() => { setMessageChannel("in_app"); setNewMessage("") }}
                    className="text-[10px] text-accent font-medium hover:underline">
                    Switch to In-App
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center px-6 bg-surface-50">
              <MessageSquare size={48} className="text-surface-300 mb-4" />
              <h3 className="text-lg font-semibold text-surface-900 mb-1">SchoolPulse Communication</h3>
              <p className="text-sm text-surface-500 max-w-sm">
                Select a conversation from the left panel to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        title="Save as Template"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowSaveTemplate(false)}
              className="inline-flex items-center justify-center rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="button"
              onClick={() => {
                if (templateName.trim() && newMessage.trim()) {
                  smsApi.templates.create(schoolId, { name: templateName.trim(), message: newMessage }).then(() => {
                    loadSmsTemplates()
                    setShowSaveTemplate(false)
                    setTemplateName("")
                  }).catch(() => {})
                }
              }}
              disabled={!templateName.trim() || !newMessage.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-surface-600">Give this message a name to reuse it later.</p>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  )
}
