export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db, auth } = getAdminServices();
    const messageId = params.id;
    const { reason, adminUid } = await request.json();
    
    if (!adminUid) {
      return NextResponse.json(
        { error: 'Admin UID is required' },
        { status: 400 }
      );
    }
    
    // Verify the user is an admin
    const adminUser = await auth.getUser(adminUid);
    const adminClaims = adminUser.customClaims;
    
    if (!adminClaims || adminClaims.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    // Get the message to check if it exists
    const messageRef = db.collection('messages').doc(messageId);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    const messageData = messageDoc.data();
    
    // Soft delete the message by updating it with deletion metadata
    await messageRef.update({
      isDeleted: true,
      deletedBy: adminUid,
      deletedAt: new Date(),
      deletionReason: reason || 'Message deleted by admin',
      content: '[Message deleted by admin]',
    });
    
    // Get admin user info for logging
    const adminUserDoc = await db.collection('users').doc(adminUid).get();
    const adminName = adminUserDoc.exists ? adminUserDoc.data()?.displayName : 'Unknown Admin';
    
    // Log the deletion action
    await db.collection('adminActions').add({
      action: 'delete_message',
      adminUid,
      adminName,
      targetMessageId: messageId,
      targetUserId: messageData?.authorId,
      targetUserName: messageData?.authorName,
      reason: reason || 'Message deleted by admin',
      timestamp: new Date(),
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Message deleted successfully',
      deletedMessage: {
        id: messageId,
        content: '[Message deleted by admin]',
        authorId: messageData?.authorId,
        authorName: messageData?.authorName,
        isDeleted: true,
        deletedBy: adminUid,
        deletedAt: new Date(),
        deletionReason: reason || 'Message deleted by admin',
      }
    });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
