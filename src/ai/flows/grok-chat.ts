import type { ChatInput } from './grok-chat.schema';

export async function grokChat(input: ChatInput): Promise<{ response: string }> {
	const last = input.prompt?.trim() || 'Hello';
	return { response: `Echo: ${last}` };
}


