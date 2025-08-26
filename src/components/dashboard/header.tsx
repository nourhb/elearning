
'use client';

import { Bell, LogOut, Search, Settings, User, Languages, Moon, Sun, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useTheme } from "next-themes";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Helper function to get a safe avatar URL
function getSafeAvatarUrl(photoURL: string | null | undefined): string {
  if (!photoURL) return DEFAULT_PLACEHOLDER_IMAGE;
  
  // Check if it's a blob URL (temporary, will become invalid)
  if (photoURL.startsWith('blob:')) {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }
  
  // Check if it's a data URL that's too long for Firebase Auth
  if (photoURL.startsWith('data:') && photoURL.length > 1000) {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }
  
  return photoURL;
}

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
   
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label="Toggle theme"
        className="h-10 w-10 rounded-lg hover:bg-accent focus-ring transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
}

function NotificationBell() {
    const { user, services } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;
        
        loadNotifications();
    }, [user?.uid]);

    const loadNotifications = async () => {
        if (!user?.uid) return;
        
        try {
            setLoading(true);
            
            // Try to load from API first
            try {
                const response = await fetch('/api/notifications?action=list&limit=20');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.notifications?.filter((n: any) => !n.read).length || 0);
                    return;
                }
            } catch (error) {
                console.log('API not available, using client-side notifications');
            }
            
            // Fallback to client-side notifications if API fails
            const mockNotifications: Notification[] = [
                {
                    id: '1',
                    userId: user.uid,
                    title: 'Welcome to EduVerse!',
                    message: 'Your account has been successfully created. Start exploring courses!',
                    type: 'success',
                    read: false,
                    createdAt: new Date(),
                    link: '/courses'
                },
                {
                    id: '2',
                    userId: user.uid,
                    title: 'System Update',
                    message: 'We\'ve added new features to improve your learning experience.',
                    type: 'info',
                    read: false,
                    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
                    link: '/dashboard'
                }
            ];
            
            // Load read status from localStorage
            const readNotifications = JSON.parse(localStorage.getItem(`notifications_read_${user.uid}`) || '[]');
            const updatedNotifications = mockNotifications.map(n => ({
                ...n,
                read: readNotifications.includes(n.id)
            }));
            
            setNotifications(updatedNotifications);
            setUnreadCount(updatedNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            // Try to update via API first
            try {
                const response = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'mark-read',
                        notificationId
                    }),
                });
                
                if (response.ok) {
                    // API succeeded, update local state
                    setNotifications(prev => 
                        prev.map(n => 
                            n.id === notificationId ? { ...n, read: true } : n
                        )
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    return;
                }
            } catch (error) {
                console.log('API not available, using localStorage');
            }
            
            // Fallback to localStorage
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            // Save to localStorage
            if (user?.uid) {
                const readNotifications = JSON.parse(localStorage.getItem(`notifications_read_${user.uid}`) || '[]');
                if (!readNotifications.includes(notificationId)) {
                    readNotifications.push(notificationId);
                    localStorage.setItem(`notifications_read_${user.uid}`, JSON.stringify(readNotifications));
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            // Try to delete via API first
            try {
                const response = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'delete',
                        notificationId
                    }),
                });
                
                if (response.ok) {
                    // API succeeded, update local state
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));
                    const remainingNotifications = notifications.filter(n => n.id !== notificationId);
                    setUnreadCount(remainingNotifications.filter(n => !n.read).length);
                    return;
                }
            } catch (error) {
                console.log('API not available, using localStorage');
            }
            
            // Fallback to localStorage
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            const remainingNotifications = notifications.filter(n => n.id !== notificationId);
            setUnreadCount(remainingNotifications.filter(n => !n.read).length);
            
            // Remove from localStorage
            if (user?.uid) {
                const readNotifications = JSON.parse(localStorage.getItem(`notifications_read_${user.uid}`) || '[]');
                const updatedReadNotifications = readNotifications.filter((id: string) => id !== notificationId);
                localStorage.setItem(`notifications_read_${user.uid}`, JSON.stringify(updatedReadNotifications));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Try to update via API first
            try {
                const response = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'mark-all-read'
                    }),
                });
                
                if (response.ok) {
                    // API succeeded, update local state
                    setNotifications(prev => 
                        prev.map(n => ({ ...n, read: true }))
                    );
                    setUnreadCount(0);
                    return;
                }
            } catch (error) {
                console.log('API not available, using localStorage');
            }
            
            // Fallback to localStorage
            setNotifications(prev => 
                prev.map(n => ({ ...n, read: true }))
            );
            setUnreadCount(0);
            
            // Save all notification IDs to localStorage
            if (user?.uid) {
                const allNotificationIds = notifications.map(n => n.id);
                localStorage.setItem(`notifications_read_${user.uid}`, JSON.stringify(allNotificationIds));
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Notifications" 
                    className={cn(
                      "relative h-10 w-10 rounded-lg hover:bg-accent focus-ring transition-all duration-200 hover:scale-105 active:scale-95",
                      isOpen && "bg-accent scale-105"
                    )}
                >
                    <Bell className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isOpen && "animate-pulse"
                    )} />
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium animate-bounce"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 border-border shadow-modern-lg" align="end">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-xs hover:bg-accent"
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-80">
                    <div className="p-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                <p className="text-sm text-muted-foreground">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">No notifications yet</p>
                                <p className="text-xs text-muted-foreground/70">We'll notify you when something important happens</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent/50 cursor-pointer",
                                        !notification.read && "bg-accent/20"
                                    )}
                                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                        notification.read ? "bg-muted-foreground/30" : "bg-primary animate-pulse"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground line-clamp-2">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground/70 mt-2">
                                            {(() => {
                                                try {
                                                    let date: Date;
                                                    if (notification.createdAt instanceof Date) {
                                                        date = notification.createdAt;
                                                    } else if (typeof notification.createdAt === 'string') {
                                                        date = new Date(notification.createdAt);
                                                    } else if (notification.createdAt && typeof notification.createdAt === 'object' && notification.createdAt.toDate) {
                                                        date = notification.createdAt.toDate();
                                                    } else if (notification.createdAt && notification.createdAt.seconds) {
                                                        // Handle Firestore Timestamp
                                                        date = new Date(notification.createdAt.seconds * 1000);
                                                    } else {
                                                        date = new Date();
                                                    }
                                                    
                                                    if (isNaN(date.getTime()) || date.getTime() <= 0) {
                                                        return 'Just now';
                                                    }
                                                    
                                                    return formatDistanceToNow(date, { addSuffix: true });
                                                } catch (error) {
                                                    console.warn('Error formatting notification date:', error);
                                                    return 'Just now';
                                                }
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

export function Header() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    router.push('/settings');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          
          {/* Search Bar with Enhanced UX */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchCourses')}
              className="w-80 pl-10 transition-all duration-200 focus:w-96"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector with Enhanced UX */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Languages"
                className="h-10 w-10 rounded-lg hover:bg-accent focus-ring transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Languages className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => changeLanguage('en')}
                className="cursor-pointer transition-colors duration-150 hover:bg-accent"
              >
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => changeLanguage('fr')}
                className="cursor-pointer transition-colors duration-150 hover:bg-accent"
              >
                🇫🇷 Français
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => changeLanguage('ar')}
                className="cursor-pointer transition-colors duration-150 hover:bg-accent"
              >
                🇸🇦 العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          {user?.role === 'admin' && <NotificationBell />}

          {/* User Menu with Enhanced UX */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full hover:bg-accent focus-ring p-0 transition-all duration-200 hover:scale-105 active:scale-95 group"
              >
                <Avatar className="h-10 w-10 avatar-modern group-hover:ring-2 group-hover:ring-primary/20 transition-all duration-200">
                  <AvatarImage 
                    src={getSafeAvatarUrl(user?.photoURL)} 
                    alt={user?.displayName || 'User'} 
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end">
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="w-fit mt-2 text-xs">
                    {user?.role || 'student'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleProfileClick}
                className="cursor-pointer p-3 rounded-lg hover:bg-accent transition-colors duration-150"
              >
                <User className="mr-3 h-4 w-4" />
                <span>{t('profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSettingsClick}
                className="cursor-pointer p-3 rounded-lg hover:bg-accent transition-colors duration-150"
              >
                <Settings className="mr-3 h-4 w-4" />
                <span>{t('settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer p-3 rounded-lg hover:bg-destructive/10 hover:text-destructive focus:text-destructive transition-colors duration-150"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
