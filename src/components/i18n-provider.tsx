'use client';

// Ensure i18next is initialized on the client before any useTranslation calls
import '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
	return children as any;
}


