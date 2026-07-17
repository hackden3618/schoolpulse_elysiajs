export interface WsClient {
  ws: WebSocket
  userId: string
  schoolId: string
  isPlatformAdmin: boolean
  subscribedConversations: Set<string>
}
