export const dynamic = 'force-static';
export const revalidate = false;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

// Function to generate a course image URL based on the course title
function generateCourseImageUrl(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Define course categories and their image URLs
  const courseImages = {
    ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center',
    artificial: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center',
    intelligence: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center',
    react: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop&crop=center',
    next: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop&crop=center',
    nextjs: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop&crop=center',
    python: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop&crop=center',
    data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
    science: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
    cyber: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&crop=center',
    security: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&crop=center',
    ux: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop&crop=center',
    design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop&crop=center',
    math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&crop=center',
    programming: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop&crop=center',
    web: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop&crop=center',
    development: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop&crop=center',
    machine: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center',
    learning: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center',
  };

  // Find the best matching category
  for (const [keyword, imageUrl] of Object.entries(courseImages)) {
    if (lowerTitle.includes(keyword)) {
      return imageUrl;
    }
  }

  // Default image for courses that don't match any category
  return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center';
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting course image generation process...');

    // Get Firebase Admin services
    const { db } = getAdminServices();

    // Get all courses from Firestore
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${courses.length} courses to process`);

    let generatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const batch = db.batch();
    const results = [];

    for (const course of courses) {
      try {
        const currentImageUrl = course.imageUrl;
        
        // Generate a new image URL based on the course title
        const newImageUrl = generateCourseImageUrl(course.title);

        // Only update if the URL is different and not already a good image
        const shouldUpdate = !currentImageUrl || 
                           currentImageUrl.startsWith('blob:') || 
                           currentImageUrl.includes('placeholder') ||
                           currentImageUrl.includes('placehold.co');

        if (shouldUpdate) {
          console.log(`Generating image for course "${course.title}": ${currentImageUrl} -> ${newImageUrl}`);
          
          const courseRef = db.collection('courses').doc(course.id);
          batch.update(courseRef, {
            imageUrl: newImageUrl,
            updatedAt: new Date()
          });
          
          generatedCount++;
          results.push({
            courseId: course.id,
            title: course.title,
            oldUrl: currentImageUrl,
            newUrl: newImageUrl,
            status: 'generated'
          });
        } else {
          console.log(`Skipping course "${course.title}" - already has a good image`);
          skippedCount++;
          results.push({
            courseId: course.id,
            title: course.title,
            oldUrl: currentImageUrl,
            newUrl: newImageUrl,
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
    if (generatedCount > 0) {
      await batch.commit();
      console.log(`Successfully generated images for ${generatedCount} courses`);
    }

    const message = `Course image generation completed! Generated: ${generatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`;
    
    return NextResponse.json({
      success: true,
      message,
      stats: {
        total: courses.length,
        generated: generatedCount,
        skipped: skippedCount,
        errors: errorCount
      },
      results: results
    });

  } catch (error: any) {
    console.error('Error generating course images:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Failed to generate course images',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
