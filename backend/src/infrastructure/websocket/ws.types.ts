export interface WsClient {
  ws: WebSocket
  userId: string
  schoolId: string
  subscribedConversations: Set<string>
}
