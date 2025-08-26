export const dynamic = 'force-static';
export const revalidate = false;

import {NextRequest, NextResponse} from 'next/server';
import {auth} from 'firebase-admin';
import {initAdmin} from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    await initAdmin();
    const {uid, role} = await request.json();

    if (!uid || !role) {
      return NextResponse.json({error: 'Missing uid or role'}, {status: 400});
    }

    await auth().setCustomUserClaims(uid, {role});

    return NextResponse.json({success: true});
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
