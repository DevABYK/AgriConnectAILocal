import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, User } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { messagingAPI, Message, User as UserType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentUserStr = localStorage.getItem('currentUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
      fetchUsers();
    }
  }, [currentUser]);

  const fetchMessages = async () => {
    if (!currentUser) return;
    try {
      const messageData = await messagingAPI.getMessages(currentUser.id);
      setMessages(messageData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUsers = async () => {
    // For now, we'll get users from messages. In a real app, you'd have a separate endpoint
    // For admin users, they can message any user
    if (!currentUser) return;

    try {
      // Get unique users from messages
      const uniqueUsers = new Map<string, UserType>();
      messages.forEach(msg => {
        if (msg.sender_id !== currentUser.id) {
          uniqueUsers.set(msg.sender_id, {
            id: msg.sender_id,
            email: '',
            full_name: msg.sender_name || 'Unknown User',
            user_type: (msg.sender_type as any) || 'buyer',
            created_at: ''
          });
        }
        if (msg.receiver_id !== currentUser.id) {
          uniqueUsers.set(msg.receiver_id, {
            id: msg.receiver_id,
            email: '',
            full_name: msg.receiver_name || 'Unknown User',
            user_type: (msg.receiver_type as any) || 'buyer',
            created_at: ''
          });
        }
      });
      setUsers(Array.from(uniqueUsers.values()));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      await messagingAPI.sendMessage({
        senderId: currentUser.id,
        receiverId: selectedConversation,
        content: newMessage.trim()
      });

      setNewMessage("");
      fetchMessages();
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getConversationMessages = () => {
    if (!selectedConversation) return [];
    return messages.filter(msg =>
      (msg.sender_id === currentUser?.id && msg.receiver_id === selectedConversation) ||
      (msg.sender_id === selectedConversation && msg.receiver_id === currentUser?.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const getConversations = () => {
    const conversations = new Map<string, { userId: string; userName: string; lastMessage: Message; unreadCount: number }>();

    messages.forEach(msg => {
      const otherUserId = msg.sender_id === currentUser?.id ? msg.receiver_id : msg.sender_id;
      const otherUserName = msg.sender_id === currentUser?.id ? msg.receiver_name : msg.sender_name;
      const isUnread = msg.receiver_id === currentUser?.id && msg.read === 0;

      if (conversations.has(otherUserId)) {
        const conv = conversations.get(otherUserId)!;
        if (new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = msg;
        }
        if (isUnread) conv.unreadCount++;
      } else {
        conversations.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName || 'Unknown User',
          lastMessage: msg,
          unreadCount: isUnread ? 1 : 0
        });
      }
    });

    return Array.from(conversations.values()).sort((a, b) =>
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/auth';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <DashboardNav userType={currentUser?.user_type || 'buyer'} onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DashboardNav userType={currentUser?.user_type || 'buyer'} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Messages
          </h1>
          <p className="text-muted-foreground">Chat with farmers, buyers, and administrators</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getConversations().map((conv) => (
                  <div
                    key={conv.userId}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      selectedConversation === conv.userId ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv.userId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium truncate">{conv.userName}</span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.lastMessage.content}
                    </p>
                  </div>
                ))}
                {getConversations().length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedConversation ? `Chat with ${getConversations().find(c => c.userId === selectedConversation)?.userName}` : 'Select a conversation'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 p-4 bg-muted/20 rounded-lg space-y-4">
                  {selectedConversation ? (
                    getConversationMessages().map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender_id === currentUser?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start messaging</p>
                    </div>
                  )}
                </div>

                {selectedConversation && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-primary to-primary/80"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
