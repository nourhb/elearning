export type ChatMessage = {
	role: 'user' | 'model';
	content: string;
};

export interface ChatInput {
	history: ChatMessage[];
	prompt: string;
}


