'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function AdminChatPageContent() {
  const { t } = useTranslation();
  const { user, services } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deleted'>('all');
  const [isDeletingMessage, setIsDeletingMessage] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const fetchMessages = useCallback(() => {
    if (!services?.db) return;
    setLoading(true);
    const q = query(collection(services.db, 'messages'), orderBy('createdAt', 'desc'));
    
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
        toast({ variant: 'destructive', title: t('error'), description: error.message || 'Failed to fetch messages' });
        setLoading(false);
    });

    return unsubscribe;
  }, [services?.db, t, toast]);

  useEffect(() => {
    const unsubscribe = fetchMessages();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchMessages]);

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

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  // Filter messages based on search term and status
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchTerm === '' || 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && !msg.isDeleted) ||
      (filterStatus === 'deleted' && msg.isDeleted);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: messages.length,
    active: messages.filter(m => !m.isDeleted).length,
    deleted: messages.filter(m => m.isDeleted).length,
  };

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Management</h1>
          <p className="text-muted-foreground">Manage and moderate community chat messages</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deleted Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.deleted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages or authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'deleted') => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="deleted">Deleted Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border ${msg.isDeleted ? 'bg-muted/50' : 'bg-background'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={msg.authorAvatar || undefined} />
                        <AvatarFallback>{getInitials(msg.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{msg.authorName}</p>
                          {msg.isDeleted && (
                            <Badge variant="destructive" className="text-xs">
                              Deleted
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`whitespace-pre-wrap ${msg.isDeleted ? 'italic opacity-60' : ''}`}>
                          {msg.isDeleted ? '[Message deleted by admin]' : msg.content}
                        </p>
                        {msg.isDeleted && msg.deletionReason && (
                          <p className="text-xs text-red-500 mt-1">
                            Deletion reason: {msg.deletionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Button for Active Messages */}
                    {!msg.isDeleted && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message? This action cannot be undone.
                              <div className="mt-4">
                                <div className="text-sm font-medium mb-2">Message from: {msg.authorName}</div>
                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                  "{msg.content}"
                                </div>
                              </div>
                              <div className="mt-4">
                                <label className="text-sm font-medium">Reason for deletion (optional):</label>
                                <Input
                                  value={deleteReason}
                                  onChange={(e) => setDeleteReason(e.target.value)}
                                  placeholder="e.g., Inappropriate content, spam, etc."
                                  className="mt-1"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <AdminChatPageContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
