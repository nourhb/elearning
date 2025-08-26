export interface GenerateCourseModulesInput { title: string }
export interface GenerateCourseModulesOutput { modules: { title: string }[] }

export async function generateCourseModules(input: GenerateCourseModulesInput): Promise<GenerateCourseModulesOutput> {
	const base = input.title?.trim() || 'Module';
	return {
		modules: [
			{ title: `${base} 1` },
			{ title: `${base} 2` },
			{ title: `${base} 3` },
		],
	};
}


