
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
import { Send, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function ChatPageContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
                <div className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-lg p-3 ${msg.authorId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="font-semibold text-sm">{msg.authorId === user?.uid ? t('you') : msg.authorName}</p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                    </p>
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
            <SidebarInset className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 flex overflow-y-hidden">
                <ChatPageContent />
              </main>
            </SidebarInset>
          </div>
      </SidebarProvider>
    );
}
