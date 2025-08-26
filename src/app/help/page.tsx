'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Settings, 
  Mail, 
  Phone,
  FileText,
  Video,
  Star,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';

function HelpPageContent() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('howToCreateCourse'),
      answer: t('howToCreateCourseAnswer'),
      category: 'courses'
    },
    {
      question: t('howToEnrollInCourse'),
      answer: t('howToEnrollInCourseAnswer'),
      category: 'enrollment'
    },
    {
      question: t('howToAccessSettings'),
      answer: t('howToAccessSettingsAnswer'),
      category: 'settings'
    },
    {
      question: t('howToChangeLanguage'),
      answer: t('howToChangeLanguageAnswer'),
      category: 'settings'
    },
    {
      question: t('howToContactSupport'),
      answer: t('howToContactSupportAnswer'),
      category: 'support'
    },
    {
      question: t('howToResetPassword'),
      answer: t('howToResetPasswordAnswer'),
      category: 'account'
    }
  ];

  const supportChannels = [
    {
      title: t('emailSupport'),
      description: t('emailSupportDescription'),
      icon: Mail,
      contact: 'support@digitalmen0.com',
      responseTime: t('within24Hours')
    },
    {
      title: t('phoneSupport'),
      description: t('phoneSupportDescription'),
      icon: Phone,
      contact: '+1 (555) 123-4567',
      responseTime: t('businessHours')
    },
    {
      title: t('liveChat'),
      description: t('liveChatDescription'),
      icon: MessageSquare,
      contact: t('availableNow'),
      responseTime: t('instant')
    }
  ];

  const quickActions = [
    {
      title: t('browseCourses'),
      description: t('browseCoursesDescription'),
      icon: BookOpen,
      href: '/courses',
      color: 'bg-blue-500'
    },
    {
      title: t('joinCommunity'),
      description: t('joinCommunityDescription'),
      icon: Users,
      href: '/community',
      color: 'bg-green-500'
    },
    {
      title: t('accessSettings'),
      description: t('accessSettingsDescription'),
      icon: Settings,
      href: '/settings',
      color: 'bg-purple-500'
    },
    {
      title: t('viewTutorials'),
      description: t('viewTutorialsDescription'),
      icon: Video,
      href: '/tutorials',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('help')}</h2>
          <p className="text-muted-foreground">
            {t('findAnswersToCommonQuestions')}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href={action.href}>
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center text-white ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Support Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('contactSupport')}
          </CardTitle>
          <CardDescription>
            {t('getHelpFromOurSupportTeam')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportChannels.map((channel, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                  <channel.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{channel.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
                <p className="text-sm font-medium">{channel.contact}</p>
                <Badge variant="secondary" className="mt-2">
                  {channel.responseTime}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('frequentlyAskedQuestions')}
          </CardTitle>
          <CardDescription>
            {t('findAnswersToCommonQuestions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                <Badge variant="outline" className="mt-2">
                  {faq.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('helpfulResources')}
          </CardTitle>
          <CardDescription>
            {t('additionalResourcesToHelpYou')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Video className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">{t('videoTutorials')}</h4>
                <p className="text-sm text-muted-foreground">{t('learnWithVideoGuides')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium">{t('documentation')}</h4>
                <p className="text-sm text-muted-foreground">{t('comprehensiveDocumentation')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <h4 className="font-medium">{t('communityForum')}</h4>
                <p className="text-sm text-muted-foreground">{t('connectWithOtherUsers')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <h4 className="font-medium">{t('featureRequests')}</h4>
                <p className="text-sm text-muted-foreground">{t('suggestNewFeatures')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HelpPage() {
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
          <main className="flex-1 overflow-y-auto">
            <HelpPageContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
