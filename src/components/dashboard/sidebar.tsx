'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen,
  Compass,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
  UserCheck,
  UserCog,
  GraduationCap,
  MessageSquare,
  BarChart3,
  GraduationCap as LogoIcon,
  Home,
  Sparkles,
  RefreshCw,
  Image,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Use public path directly to avoid bundling the image file
const LogoLight = '/cropped-tfiiih-e1738853451374.png';
const LogoDark = '/cropped-tfiiih-e1738853451374.webp';

export function AppSidebar() {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { user } = useAuth();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isFormateur = user?.role === 'formateur';
  const isStudent = user?.role === 'student';

  const handleLogoError = () => {
    setLogoError(true);
    console.error('Failed to load logo images');
  };

  const menuItems = [
    {
      href: '/',
      icon: Home,
      label: t('dashboard'),
      active: pathname === '/',
      show: true,
    },
    {
      href: '/student/dashboard',
      icon: GraduationCap,
      label: t('studentDashboard'),
      active: pathname.startsWith('/student/dashboard'),
      show: isStudent,
      badge: 'Student',
    },
    {
      href: '/admin',
      icon: UserCog,
      label: t('adminDashboard'),
      active: pathname.startsWith('/admin') && !pathname.startsWith('/admin/chat'),
      show: isAdmin,
      badge: 'Admin',
    },
    {
      href: '/admin/chat',
      icon: MessageSquare,
      label: 'Chat Management',
      active: pathname.startsWith('/admin/chat'),
      show: isAdmin,
      badge: 'Admin',
    },
    {
      href: '/formateur',
      icon: UserCheck,
      label: t('formateurDashboard'),
      active: pathname.startsWith('/formateur'),
      show: isFormateur,
      badge: 'Instructor',
    },
    {
      href: '/courses',
      icon: Compass,
      label: t('exploreCourses'),
      active: pathname.startsWith('/courses'),
      show: true,
    },
    {
      href: '/community',
      icon: Users,
      label: t('community'),
      active: pathname.startsWith('/community'),
      show: true,
    },
    {
      href: '/chat',
      icon: MessageSquare,
      label: t('chat'),
      active: pathname.startsWith('/chat'),
      show: true,
    },
    {
      href: '/settings',
      icon: Settings,
      label: t('settings'),
      active: pathname.startsWith('/settings'),
      show: true,
    },
    {
      href: '/help',
      icon: LifeBuoy,
      label: t('help'),
      active: pathname.startsWith('/help'),
      show: true,
    },
  ];

  const footerItems = [
    {
      href: '/help',
      icon: LifeBuoy,
      label: t('help'),
      show: true,
    },
  ];

  return (
    <Sidebar className="border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="border-b border-border/40 p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm transition-all duration-200 hover:scale-105">
            {!logoError ? (
              <>
                <img
                  src={LogoLight}
                  alt="Logo"
                  className="h-full w-full object-cover dark:hidden"
                  onError={handleLogoError}
                />
                <img
                  src={LogoDark}
                  alt="Logo"
                  className="hidden h-full w-full object-cover dark:block"
                  onError={handleLogoError}
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                <LogoIcon className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">DigitalMen0</span>
            <span className="text-xs text-muted-foreground">Learning Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      item.active
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center transition-all duration-200",
                      item.active && "scale-110"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 transition-all duration-200 group-hover:translate-x-1">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-auto text-xs transition-all duration-200",
                          item.active && "bg-primary/20 text-primary"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.active && (
                      <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="flex flex-col gap-2">
          {footerItems
            .filter((item) => item.show)
            .map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className="justify-start gap-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          
          {/* User Status Indicator */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                user?.role === 'admin' ? "bg-red-500" :
                user?.role === 'formateur' ? "bg-blue-500" : "bg-green-500"
              )} />
              <span className="text-xs font-medium text-muted-foreground">
                {user?.role || 'student'}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {user?.displayName || user?.email}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
