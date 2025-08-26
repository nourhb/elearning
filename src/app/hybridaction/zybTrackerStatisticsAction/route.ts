export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
	// For static export, return a simple response
	return new Response(null, { status: 204 });
}


