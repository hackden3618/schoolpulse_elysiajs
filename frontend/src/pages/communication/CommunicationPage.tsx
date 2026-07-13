import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { MessageSquare, Send, AlertCircle, RefreshCw, X, Plus, CheckCheck, Check, XCircle, Clock, Megaphone, ArrowLeft, Users, Smartphone, ChevronDown, ChevronRight, UserCheck } from "lucide-react"
import { Card } from "../../components/ui/Card"
import { Skeleton } from "../../components/ui/Skeleton"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { withMinDelay } from "../../lib/ux"
import { conversationsApi, smsApi, membershipsApi, studentsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { useWebSocket } from "../../lib/websocket"
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
  const [messageChannel, setMessageChannel] = useState<"in_app" | "sms">("in_app")

  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])
  const [smsTemplatesLoading, setSmsTemplatesLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  const [staffMembers, setStaffMembers] = useState<StaffEntry[]>([])
  const [guardianEntries, setGuardianEntries] = useState<GuardianEntry[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set())
  const [recipientsLoading, setRecipientsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const [showNewConv, setShowNewConv] = useState(false)
  const [convType, setConvType] = useState<"direct" | "group" | "announcement">("direct")
  const [convSubject, setConvSubject] = useState("")
  const [convParticipantIds, setConvParticipantIds] = useState<Set<string>>(new Set())
  const [creatingConv, setCreatingConv] = useState(false)

  const onNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
    setConversations((prev) => prev.map((c) => {
      if (c.id === msg.conversationId) return { ...c, messages: [{ ...msg, isLatest: true }, ...c.messages.slice(0, 0)] }
      return c
    }))
  }, [])

  const onReceiptUpdate = useCallback((msg: Message) => {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? msg : m))
  }, [])

  const wsSubs = selectedConv
    ? [{ conversationId: selectedConv.id, onMessage: onNewMessage, onReceiptUpdate }]
    : []

  const { subscribe } = useWebSocket(wsSubs)

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

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    setMessageChannel("in_app")
    setError("")
    try {
      const res = await conversationsApi.messages.list(schoolId, conv.id)
      setMessages(res.data)
      subscribe(conv.id)
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
        await smsApi.send(schoolId, { recipients: recipientPhones, message: newMessage })
      } else {
        await conversationsApi.messages.send(schoolId, selectedConv.id, {
          content: newMessage,
          channel: messageChannel,
        })
      }
      setNewMessage("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleCreateConv = async (e: FormEvent) => {
    e.preventDefault()
    if (!convSubject && convType !== "direct") return
    setCreatingConv(true)
    try {
      const res = await conversationsApi.create(schoolId, {
        type: convType,
        subject: convSubject || undefined,
        participantIds: convParticipantIds.size > 0 ? Array.from(convParticipantIds) : undefined,
      })
      setShowNewConv(false)
      setConvType("direct"); setConvSubject(""); setConvParticipantIds(new Set())
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

  const toggleAllGuardiansOfRelationship = (relationship: string, checked: boolean) => {
    const ids = guardianEntries.filter((g) => g.relationship === relationship).map((g) => g.userId)
    setSelectedRecipientIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const toggleAllStaff = (checked: boolean) => {
    setSelectedRecipientIds((prev) => {
      const next = new Set(prev)
      for (const s of staffMembers) {
        if (checked) next.add(s.userId)
        else next.delete(s.userId)
      }
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

  const relationshipLabels: Record<string, string> = {
    father: "Father",
    mother: "Mother",
    sibling: "Sibling",
    emergency: "Emergency Contact",
    sponsor: "Sponsor",
    legal_guardian: "Legal Guardian",
    step_parent: "Step Parent",
    relative: "Relative",
    other: "Other",
  }

  const selectedCount = selectedRecipientIds.size
  const relationshipGroups = Array.from(new Set(guardianEntries.map((g) => g.relationship)))

  const renderSmsCompose = () => {
    if (messageChannel !== "sms" || !selectedConv) return null

    return (
      <div className="shrink-0 border-t border-surface-100 bg-white">
        <div className="px-4 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
          {/* Recipient Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
                <Users size={12} /> Recipients {selectedCount > 0 && <span className="text-accent font-medium">({selectedCount})</span>}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => toggleAllStaff(true)}
                  className="text-[10px] text-accent font-semibold hover:underline">All Staff</button>
                <button type="button" onClick={() => toggleAllStaff(false)}
                  className="text-[10px] text-surface-400 hover:underline">Clear Staff</button>
              </div>
            </div>
            {recipientsLoading ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-surface-100 rounded-lg p-2">
                {/* Staff */}
                {staffMembers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-1 py-0.5">
                      <span className="text-[10px] font-semibold text-surface-600">Staff ({staffMembers.length})</span>
                      <span className="text-[9px] text-surface-400">{staffMembers.filter((s) => selectedRecipientIds.has(s.userId)).length}/{staffMembers.length}</span>
                    </div>
                    {staffMembers.map((s) => (
                      <label key={s.userId} className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-surface-50 cursor-pointer">
                        <input type="checkbox" checked={selectedRecipientIds.has(s.userId)}
                          onChange={() => toggleRecipient(s.userId)}
                          className="h-3 w-3 rounded border-surface-300 text-accent focus:ring-accent" />
                        <span className="text-xs text-surface-700 truncate flex-1">{s.name}</span>
                        <span className="text-[9px] text-surface-400">{s.phone}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Guardians grouped by relationship */}
                {relationshipGroups.length > 0 && (
                  <div className="border-t border-surface-100 pt-1.5 mt-1.5">
                    <div className="flex items-center justify-between px-1 pb-1">
                      <span className="text-[10px] font-semibold text-surface-600">Guardians ({guardianEntries.length})</span>
                      <span className="text-[9px] text-surface-400">{guardianEntries.filter((g) => selectedRecipientIds.has(g.userId)).length}/{guardianEntries.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-1 pb-1.5 flex-wrap">
                      {relationshipGroups.map((rel) => {
                        const relGuardians = guardianEntries.filter((g) => g.relationship === rel)
                        const relSelected = relGuardians.filter((g) => selectedRecipientIds.has(g.userId)).length
                        const allSelected = relSelected === relGuardians.length
                        const label = relationshipLabels[rel] || rel
                        return (
                          <button
                            key={rel}
                            type="button"
                            onClick={() => toggleAllGuardiansOfRelationship(rel, !allSelected)}
                            className={`text-[9px] rounded-full px-2 py-0.5 border transition-colors ${
                              allSelected
                                ? "bg-accent text-white border-accent"
                                : relSelected > 0
                                ? "bg-accent-50 text-accent border-accent-200"
                                : "bg-white text-surface-500 border-surface-200 hover:border-surface-300"
                            }`}
                          >
                            {label} {relSelected}/{relGuardians.length}
                          </button>
                        )
                      })}
                    </div>
                    {guardianEntries.map((g) => (
                      <label key={g.userId} className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-surface-50 cursor-pointer">
                        <input type="checkbox" checked={selectedRecipientIds.has(g.userId)}
                          onChange={() => toggleRecipient(g.userId)}
                          className="h-3 w-3 rounded border-surface-300 text-accent focus:ring-accent" />
                        <span className="text-xs text-surface-700 truncate flex-1">{g.name}</span>
                        {g.isPrimary && <UserCheck size={10} className="text-accent shrink-0" />}
                        <span className="text-[9px] text-surface-400 capitalize">{g.relationship}</span>
                      </label>
                    ))}
                  </div>
                )}

                {staffMembers.length === 0 && guardianEntries.length === 0 && (
                  <p className="text-[10px] text-surface-400 text-center py-2">No recipients available.</p>
                )}
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
                <button type="button" onClick={() => { const n = prompt("Template name:"); if (n && newMessage.trim()) smsApi.templates.create(schoolId, { name: n, message: newMessage }).then(() => loadSmsTemplates()).catch(() => {}) }}
                  disabled={!newMessage.trim()}
                  className="text-[10px] border border-dashed border-surface-300 rounded-full px-2.5 py-1 text-accent hover:bg-accent-50 transition-colors disabled:opacity-40">
                  <Plus size={10} className="inline mr-0.5" />Save
                </button>
              </div>
            )}
          </div>

          {/* SMS Message Input and Metrics */}
          <div className="space-y-1.5">
            <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
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
      </div>
    )
  }

  const renderNewConvDialog = () => (
    <div className="shrink-0 border-b border-surface-100 bg-white">
      <form onSubmit={handleCreateConv} className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-700">New Conversation</span>
          <button type="button" onClick={() => setShowNewConv(false)} className="p-1 rounded hover:bg-surface-100">
            <X size={14} className="text-surface-400" />
          </button>
        </div>
        <div className="flex gap-2">
          <select value={convType} onChange={(e) => setConvType(e.target.value as any)}
            className="block rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs flex-1">
            <option value="direct">Direct</option>
            <option value="group">Group</option>
            <option value="announcement">Announcement</option>
          </select>
          <Button size="sm" type="submit" disabled={creatingConv}>{creatingConv ? "..." : "Create"}</Button>
        </div>
        <input type="text" value={convSubject} onChange={(e) => setConvSubject(e.target.value)}
          placeholder="Subject (required for group/announcement)..." className="block w-full rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs" />
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
            <button onClick={() => setShowNewConv(!showNewConv)}
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
                return (
                  <button key={c.id} onClick={() => selectConversation(c)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-surface-50 last:border-0 text-left hover:bg-surface-50 transition-colors ${
                      selectedConv?.id === c.id ? "bg-accent-50 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"
                    }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                      c.type === "announcement" ? "bg-accent-50 text-accent" : "bg-primary-100 text-primary-600"
                    }`}>
                      {c.type === "announcement" ? <Megaphone size={16} /> : <MessageSquare size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-surface-900 truncate">{convName(c)}</p>
                        <Badge variant={c.type === "announcement" ? "warning" : "info"} className="shrink-0 capitalize text-[9px]">{c.type}</Badge>
                      </div>
                      {lm && <p className="text-xs text-surface-500 truncate mt-0.5">{lm.content}</p>}
                      <p className="text-[10px] text-surface-400 mt-1">{lm ? timeAgo(lm.createdAt) : formatDate(c.createdAt)}</p>
                    </div>
                  </button>
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-[#e5ddd5]"
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
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="text-[11px] text-surface-500 bg-white/80 shadow-sm px-3 py-1 rounded-full font-medium">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                            <div className={`max-w-[75%] min-w-[120px] rounded-lg px-3 py-2 ${
                              isMe ? "bg-[#d9fdd3] text-surface-900" : "bg-white text-surface-900 shadow-sm"
                            }`}>
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
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                <span className="text-[10px] text-surface-400">{formatTime(msg.createdAt)}</span>
                                {isMe && <DeliveryIcon msg={msg} />}
                              </div>
                            </div>
                          </div>
                          {isMe && receipts.length > 0 && (
                            <div className="flex justify-end mr-1 mb-1">
                              <div className="flex items-center gap-1.5 text-[9px] text-surface-400">
                                <span>{sentCount}/{receipts.length} sent</span>
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

              {/* SMS Compose (when SMS channel is active) */}
              {renderSmsCompose()}

              {/* In-App Message Input (when in_app channel) */}
              {messageChannel === "in_app" && (
                <div className="shrink-0 px-4 py-3 bg-white border-t border-surface-100">
                  <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <select value={messageChannel} onChange={(e) => setMessageChannel(e.target.value as any)}
                      className="rounded-lg border border-surface-200 bg-white px-2 py-2.5 text-xs shrink-0">
                      <option value="in_app">In-App</option>
                      <option value="sms">SMS</option>
                    </select>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  )
}
