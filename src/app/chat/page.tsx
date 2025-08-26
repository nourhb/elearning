
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, RefreshCw, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function ChatPageContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeletingMessage, setIsDeletingMessage] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(() => {
    if (!services?.db) return;
    setLoading(true);
    const q = query(collection(services.db, 'messages'), orderBy('createdAt', 'asc'));
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            msgs.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            } as ChatMessage);
        });
        setMessages(msgs);
        setLoading(false);
    }, (error) => {
        console.error('Failed to fetch messages:', error);
        toast({ variant: 'destructive', title: t('error'), description: error.message || t('failedToFetchMessages') });
        setLoading(false);
    });

    // Return the unsubscribe function to clean up the listener
    return unsubscribe;
  }, [services?.db, t, toast]);


  useEffect(() => {
    const unsubscribe = fetchMessages();
    // Cleanup listener on component unmount
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchMessages]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !services?.db) return;

    try {
      await addDoc(collection(services.db, 'messages'), {
        content: newMessage,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
      // No need to call fetchMessages, onSnapshot will handle it.
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ variant: 'destructive', title: t('error'), description: t('failedToSendMessages') });
    }
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  const handleDeleteMessage = async (messageId: string, reason: string) => {
    if (!user || user.role !== 'admin') return;
    
    setIsDeletingMessage(messageId);
    try {
      const response = await fetch(`/api/admin/messages/${messageId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUid: user.uid,
          reason: reason || 'Message deleted by admin',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Message Deleted',
          description: 'The message has been deleted successfully.',
        });
        setDeleteReason('');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete message',
      });
    } finally {
      setIsDeletingMessage(null);
    }
  };


  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-6">
       <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('liveChatForum')}</h2>
            <p className="text-muted-foreground">{t('chatWithEveryone')}</p>
          </div>
        </header>

      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {loading && messages.length === 0 && <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {!loading && messages.length === 0 && (
                <div className="text-center text-muted-foreground py-10">{t('noMessagesYet')}</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.authorId === user?.uid ? 'justify-end' : ''}`}
              >
                 {msg.authorId !== user?.uid && (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.authorAvatar || undefined} />
                      <AvatarFallback>{getInitials(msg.authorName)}</AvatarFallback>
                    </Avatar>
                 )}
                <div className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-lg p-3 relative group ${msg.authorId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{msg.authorId === user?.uid ? t('you') : msg.authorName}</p>
                        <p className={`whitespace-pre-wrap ${msg.isDeleted ? 'italic opacity-60' : ''}`}>
                          {msg.isDeleted ? '[Message deleted by admin]' : msg.content}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                            {msg.isDeleted && msg.deletionReason && (
                              <span className="ml-2 text-red-500">
                                • Deleted: {msg.deletionReason}
                              </span>
                            )}
                        </p>
                      </div>
                      
                      {/* Admin Delete Button */}
                      {user?.role === 'admin' && !msg.isDeleted && (
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this message? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="px-6">
                                <div className="text-sm font-medium mb-2">Message from: {msg.authorName}</div>
                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded mb-4">
                                  "{msg.content}"
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Reason for deletion (optional):</label>
                                  <Input
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="e.g., Inappropriate content, spam, etc."
                                  />
                                </div>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteReason('')}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMessage(msg.id, deleteReason)}
                                  disabled={isDeletingMessage === msg.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeletingMessage === msg.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete Message'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                </div>
                 {msg.authorId === user?.uid && (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.authorAvatar || undefined} />
                      <AvatarFallback>{getInitials(msg.authorName)}</AvatarFallback>
                    </Avatar>
                 )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('typeYourMessage')}
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}


export default function ChatPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
    }
  
    return (
       <SidebarProvider>
          <div className="flex">
            <AppSidebar />
            <SidebarInset className="flex-1 flex flex-col md:ml-64">
              <Header />
              <main className="flex-1 flex overflow-y-hidden">
                <ChatPageContent />
              </main>
            </SidebarInset>
          </div>
      </SidebarProvider>
    );
}
