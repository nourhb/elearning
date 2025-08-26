'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/header';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Save,

  Trash2,
  Download,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { CloudinaryImageUpload } from '@/components/dashboard/cloudinary-image-upload';

function SettingsPageContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get user document from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData?.displayName || user.displayName || '');
          setEmail(user.email || '');
          setBio(userData?.bio || '');
          setAvatarUrl(userData?.photoURL || user.photoURL || '');
          
          // Load preferences
          setEmailNotifications(userData?.preferences?.emailNotifications ?? true);
          setPushNotifications(userData?.preferences?.pushNotifications ?? true);
          setCourseUpdates(userData?.preferences?.courseUpdates ?? true);
        } else {
          // Set defaults if user document doesn't exist
          setDisplayName(user.displayName || '');
          setEmail(user.email || '');
          setBio('');
          setAvatarUrl(user.photoURL || '');
          
          // Create user document if it doesn't exist
          try {
            await setDoc(userDocRef, {
              displayName: user.displayName || '',
              email: user.email || '',
              photoURL: user.photoURL || '',
              bio: '',
              preferences: {
                emailNotifications: true,
                pushNotifications: true,
                courseUpdates: true,
                theme: 'system',
                language: 'en'
              },
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } catch (error) {
            console.error('Error creating user document:', error);
          }
        }
        
        // Load theme and language from localStorage
        const savedTheme = localStorage.getItem('theme') || 'system';
        const savedLanguage = localStorage.getItem('language') || 'en';
        setTheme(savedTheme as 'light' | 'dark' | 'system');
        setLanguage(savedLanguage);
        
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          variant: 'destructive',
          title: t('errorLoadingData'),
          description: t('failedToLoadUserData'),
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, toast, t]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Get the current Firebase Auth user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: displayName,
        photoURL: avatarUrl
      });

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        photoURL: avatarUrl,
        bio: bio,
        preferences: {
          emailNotifications,
          pushNotifications,
          courseUpdates,
          theme,
          language
        },
        updatedAt: new Date()
      });

      toast({
        title: t('profileUpdated'),
        description: t('profileUpdatedSuccessfully'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: t('updateFailed'),
        description: t('failedToUpdateProfile'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('passwordsDoNotMatch'),
        description: t('pleaseCheckYourPasswords'),
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: t('passwordTooShort'),
        description: t('passwordMustBeAtLeast6Characters'),
      });
      return;
    }

    setSaving(true);
    try {
      // Get the current Firebase Auth user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      await updatePassword(currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: t('passwordUpdated'),
        description: t('passwordUpdatedSuccessfully'),
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        variant: 'destructive',
        title: t('updateFailed'),
        description: t('failedToUpdatePassword'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme immediately
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    window.location.reload();
  };



  if (loading) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('loadingSettings')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
          <p className="text-muted-foreground">
            {t('manageYourAccountSettingsAndPreferences')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('notifications')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('appearance')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t('security')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profileInformation')}
              </CardTitle>
              <CardDescription>
                {t('updateYourProfileInformationAndAvatar')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                                             <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                                          <CloudinaryImageUpload
                        currentImageUrl={avatarUrl}
                        onImageUrlChange={setAvatarUrl}
                        label={t('profilePicture')}
                        description={t('uploadYourProfilePicture')}
                        aspectRatio="square"
                        maxSize={2}
                      />
                  </div>
                 <div className="flex-1">
                   <div className="space-y-2">
                     <Label htmlFor="displayName">{t('displayName')}</Label>
                     <Input
                       id="displayName"
                       value={displayName}
                       onChange={(e) => setDisplayName(e.target.value)}
                       placeholder={t('enterYourDisplayName')}
                     />
                   </div>
                 </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('emailCannotBeChanged')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('role')}</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('tellUsAboutYourself')}
                  rows={3}
                />
              </div>

              <Button onClick={handleProfileUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notificationPreferences')}
              </CardTitle>
              <CardDescription>
                {t('chooseWhatNotificationsYouWantToReceive')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('emailNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('receiveNotificationsViaEmail')}
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('pushNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('receiveNotificationsInBrowser')}
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('courseUpdates')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationsAboutCourseUpdates')}
                    </p>
                  </div>
                  <Switch
                    checked={courseUpdates}
                    onCheckedChange={setCourseUpdates}
                  />
                </div>
              </div>
              
              <Button onClick={handleProfileUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('appearanceSettings')}
              </CardTitle>
              <CardDescription>
                {t('customizeTheLookAndFeelOfTheApplication')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('theme')}</Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          {t('light')}
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          {t('dark')}
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {t('system')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('language')}</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="fr">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Français
                        </div>
                      </SelectItem>
                      <SelectItem value="ar">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          العربية
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleProfileUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('securitySettings')}
              </CardTitle>
              <CardDescription>
                {t('manageYourAccountSecurity')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('enterCurrentPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('enterNewPassword')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmNewPassword')}
                  />
                </div>

                <Button onClick={handlePasswordChange} disabled={saving}>
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      {t('updating')}
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      {t('updatePassword')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
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
            <SettingsPageContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
