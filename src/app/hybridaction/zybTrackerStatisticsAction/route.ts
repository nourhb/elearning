export async function GET(request: Request) {
	const url = new URL(request.url);
	const callback = url.searchParams.get('__callback__');
	// Return JSONP if a callback is provided, otherwise no-content
	if (callback) {
		const body = `${callback}({"ok":true})`;
		return new Response(body, {
			headers: { 'content-type': 'application/javascript; charset=utf-8' },
			status: 200,
		});
	}
	return new Response(null, { status: 204 });
}


