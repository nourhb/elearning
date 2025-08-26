import { getAdminServices } from '@/lib/firebase-admin';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

export async function fixCourseImages(): Promise<string> {
  const { db } = getAdminServices();
  
  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    
    if (coursesSnapshot.empty) {
      return 'No courses found in database.';
    }

    let updatedCount = 0;
    const batch = db.batch();

    coursesSnapshot.docs.forEach((doc) => {
      const courseData = doc.data();
      const currentImageUrl = courseData.imageUrl;

      // Check if the imageUrl is a blob URL
      if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
        console.log(`Fixing course "${courseData.title}" - replacing blob URL with placeholder`);
        
        batch.update(doc.ref, {
          imageUrl: DEFAULT_PLACEHOLDER_IMAGE
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      return `Successfully updated ${updatedCount} courses with placeholder images.`;
    } else {
      return 'No courses with blob URLs found. All courses are already using proper image URLs.';
    }
    
  } catch (error: any) {
    console.error('Error fixing course images:', error);
    throw new Error(`Failed to fix course images: ${error.message}`);
  }
}
