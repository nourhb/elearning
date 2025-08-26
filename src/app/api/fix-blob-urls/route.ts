export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { db } = getAdminServices();
    
    console.log('🔍 Scanning for blob URLs...');
    
    // Fix course images
    const coursesSnapshot = await db.collection('courses').get();
    let courseUpdates = 0;
    
    coursesSnapshot.docs.forEach((doc) => {
      const courseData = doc.data();
      const currentImageUrl = courseData.imageUrl;
      
      if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
        console.log(`📝 Fixing course "${courseData.title}" - replacing blob URL with placeholder`);
        doc.ref.update({ imageUrl: DEFAULT_PLACEHOLDER_IMAGE });
        courseUpdates++;
      }
    });
    
    // Fix user avatars (if they exist in a users collection)
    let userUpdates = 0;
    try {
      const usersSnapshot = await db.collection('users').get();
      
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const currentPhotoURL = userData.photoURL;
        
        if (currentPhotoURL && currentPhotoURL.startsWith('blob:')) {
          console.log(`👤 Fixing user "${userData.displayName || userData.email}" - replacing blob URL with placeholder`);
          doc.ref.update({ photoURL: DEFAULT_PLACEHOLDER_IMAGE });
          userUpdates++;
        }
      });
    } catch (error) {
      console.log('ℹ️  No users collection found or no blob URLs in user avatars');
    }
    
    console.log(`✅ Fixed ${courseUpdates} course images and ${userUpdates} user avatars`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully fixed ${courseUpdates} course images and ${userUpdates} user avatars.`,
      courseUpdates,
      userUpdates
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing blob URLs:', error);
    return NextResponse.json({ 
      error: 'Failed to fix blob URLs',
      details: error.message 
    }, { status: 500 });
  }
}
