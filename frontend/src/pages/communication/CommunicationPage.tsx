import { MessageSquare, Send, Users } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"

const conversations = [
  { id: "1", with: "Mr. Kamau (Class 4)", lastMessage: "The field trip permission slips are due Friday.", unread: true, time: "5 min ago" },
  { id: "2", with: "Mrs. Akinyi (Science)", lastMessage: "Grade 6 lab results are ready for review.", unread: false, time: "2 hours ago" },
  { id: "3", with: "Parents - Class 5", lastMessage: "Parent-Teacher meeting scheduled for July 20th.", unread: true, time: "1 day ago" },
  { id: "4", with: "ICT Support", lastMessage: "Your portal access has been updated.", unread: false, time: "3 days ago" },
]

export function CommunicationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication"
        description="Conversations, announcements, and messaging."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary">
              <Users size={16} />
              New Conversation
            </Button>
            <Button>
              <Send size={16} />
              Send Announcement
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            {conversations.map((c) => (
              <button
                key={c.id}
                className="w-full flex items-start gap-3 px-4 py-3 border-b border-surface-100 last:border-0 text-left hover:bg-surface-50 transition-colors"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${c.unread ? "bg-primary-100 text-primary-600" : "bg-surface-100 text-surface-500"}`}>
                  <MessageSquare size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${c.unread ? "font-semibold text-surface-900" : "text-surface-700"}`}>
                      {c.with}
                    </p>
                    {c.unread && <Badge variant="info" className="shrink-0">New</Badge>}
                  </div>
                  <p className="text-xs text-surface-500 truncate mt-0.5">{c.lastMessage}</p>
                  <p className="text-xs text-surface-400 mt-1">{c.time}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-surface-900">Select a conversation</h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={36} className="text-surface-300 mb-3" />
              <p className="text-sm text-surface-500">Choose a conversation from the left or start a new one.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TODO: Backend Integration
       *
       * [ ] GET    /api/v1/schools/:schoolId/conversations                      – List conversations
       * [ ] POST   /api/v1/schools/:schoolId/conversations                      – Create conversation
       * [ ] GET    /api/v1/schools/:schoolId/conversations/:id/messages         – List messages
       * [ ] POST   /api/v1/schools/:schoolId/conversations/:id/messages         – Send message
       * [ ] POST   /api/v1/schools/:schoolId/announcements                      – Broadcast announcement
       * [ ] GET    /api/v1/schools/:schoolId/notifications                      – Notification log
       */}
    </div>
  )
}
