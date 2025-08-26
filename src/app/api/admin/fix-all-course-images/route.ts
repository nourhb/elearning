import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { getCourseImageUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting comprehensive course image fix process...');

    // Get Firebase Admin services
    const { db } = getAdminServices();

    // Get all courses from Firestore
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${courses.length} courses to process`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const batch = db.batch();
    const results = [];

    for (const course of courses) {
      try {
        const currentImageUrl = course.imageUrl;
        
        // Use the getCourseImageUrl function to determine the correct image URL
        const fixedImageUrl = getCourseImageUrl({
          imageUrl: currentImageUrl,
          title: course.title
        });

        // Only update if the URL has changed
        if (currentImageUrl !== fixedImageUrl) {
          console.log(`Fixing course "${course.title}": ${currentImageUrl} -> ${fixedImageUrl}`);
          
          const courseRef = db.collection('courses').doc(course.id);
          batch.update(courseRef, {
            imageUrl: fixedImageUrl,
            updatedAt: new Date()
          });
          
          fixedCount++;
          results.push({
            courseId: course.id,
            title: course.title,
            oldUrl: currentImageUrl,
            newUrl: fixedImageUrl,
            status: 'fixed'
          });
        } else {
          console.log(`Skipping course "${course.title}" - image URL is already correct`);
          skippedCount++;
          results.push({
            courseId: course.id,
            title: course.title,
            oldUrl: currentImageUrl,
            newUrl: fixedImageUrl,
            status: 'skipped'
          });
        }
      } catch (error) {
        console.error(`Error processing course "${course.title}":`, error);
        errorCount++;
        results.push({
          courseId: course.id,
          title: course.title,
          error: error.message,
          status: 'error'
        });
      }
    }

    // Commit all changes in a single batch
    if (fixedCount > 0) {
      await batch.commit();
      console.log(`Successfully fixed ${fixedCount} courses`);
    }

    const message = `Course images fix completed! Fixed: ${fixedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`;
    
    return NextResponse.json({
      success: true,
      message,
      stats: {
        total: courses.length,
        fixed: fixedCount,
        skipped: skippedCount,
        errors: errorCount
      },
      results: results
    });

  } catch (error: any) {
    console.error('Error fixing course images:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Failed to fix course images',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
