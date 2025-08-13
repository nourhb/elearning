
'use client';

import { Bell, LogOut, Search, Settings, User, Languages, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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


export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
   
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label="Toggle theme"
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

    useEffect(() => {
        if (!user || !services?.db) return;
        
        const q = query(collection(services.db, 'notifications'), where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Notification))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user, services?.db]);
    
    const handleMarkAsRead = async (notificationId: string) => {
        if (!services?.db) return;
        const notifRef = doc(services.db, 'notifications', notificationId);
        await updateDoc(notifRef, { read: true });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 font-medium border-b">Notifications</div>
                <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div key={notif.id} className={`p-4 border-b ${!notif.read ? 'bg-accent/50' : ''}`}>
                                <h4 className="font-semibold">{notif.title}</h4>
                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                {!notif.read && (
                                    <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => handleMarkAsRead(notif.id)}>
                                        Mark as read
                                    </Button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">You have no notifications.</div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

export function Header() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        router.push(`/courses?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="mr-auto">
        <SidebarTrigger className="md:hidden" />
      </div>

      <form onSubmit={handleSearch} className="relative hidden w-full max-w-md md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder={t('searchCourses')} 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Languages">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('fr')}>Français</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ar')}>العربية</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {user?.role === 'admin' && <NotificationBell />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || '/Countries-page-image-placeholder-800x500.webp'} alt={user?.displayName || 'User'} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || 'Alex Johnson'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{t('profile')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
