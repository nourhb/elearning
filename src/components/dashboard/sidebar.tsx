'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
import LogoLight from '../../cropped-tfiiih-e1738853451374.png';
import LogoDark from '../../cropped-tfiiih-e1738853451374.webp';


export function AppSidebar() {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === 'admin';
  const isFormateur = user?.role === 'formateur';
  const isStudent = user?.role === 'student';


  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <Button variant="ghost" className="h-44 w-full justify-center px-2">
           <Image
              src={LogoLight}
              alt="digitalmen0 Logo"
              width={170}
              height={170}
              className="dark:hidden"
            />
            <Image
              src={LogoDark}
              alt="digitalmen0 Logo"
              width={170}
              height={170}
              className="hidden dark:block"
            />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              tooltip={{ children: t('dashboard') }}
            >
              <Link href="/">
                <LayoutDashboard />
                <span>{t('dashboard')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {isStudent && (
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/student/dashboard')} tooltip={{ children: t('studentDashboard') }}>
                <Link href="/student/dashboard">
                  <GraduationCap />
                  <span>{t('studentDashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip={{ children: t('adminDashboard') }}>
                <Link href="/admin">
                  <UserCog />
                  <span>{t('adminDashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {(isFormateur || isAdmin) && (
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/formateur')} tooltip={{ children: t('formateurDashboard') }}>
                <Link href="/formateur">
                  <UserCheck />
                  <span>{t('formateurDashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/courses')} tooltip={{ children: t('exploreCourses') }}>
              <Link href="/courses">
                <Compass />
                <span>{t('exploreCourses')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/community')} tooltip={{ children: t('community') }}>
              <Link href="/community">
                <Users />
                <span>{t('community')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/chat')} tooltip={{ children: t('chat') }}>
              <Link href="/chat">
                <MessageSquare />
                <span>{t('chat')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} tooltip={{ children: t('settings') }}>
              <Link href="/settings">
                <Settings />
                <span>{t('settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/help')} tooltip={{ children: t('help') }}>
              <Link href="/help">
                <LifeBuoy />
                <span>{t('help')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
