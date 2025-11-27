import type { ToolCategory, ToolDefinition } from '$lib/tools/types';
import { slugify } from '$lib/utils/slug.utils';

/**
 * Recursively walk the category tree and find the tool
 * matching the given category path and tool slug.
 *
 * @param path Array of category slugs leading to the tool
 * @param toolSlug Slug of the tool to find
 * @param tree The category tree to search within
 * @returns The matching ToolDefinition or null if not found
 */
export function findTool(
	path: string[],
	toolSlug: string,
	tree: ToolCategory[],
): ToolDefinition | null {
	if (path.length === 0) return null;

	let currentLevel = tree;

	for (let i = 0; i < path.length; i++) {
		const segment = path[i];

		// locate category in current level
		const category = currentLevel.find(
			(cat) => slugify(cat.name) === segment
		);

		if (!category) return null;

		// last segment → look for tool here
		const isLast = i === path.length - 1;

		if (isLast) {
			const tool = category.tools.find(
				(t) => slugify(t.title) === toolSlug
			);
			return tool ?? null;
		}

		// otherwise continue deeper
		currentLevel = category.subgroups;
	}

	return null;
}

/**
 * Generate URLs for all tools in the category tree.
 *
 * @param categories The root categories to start from
 * @param path The current path segments (used in recursion)
 * @returns Array of objects containing tool URLs and their definitions
 */
export function generateToolURLs(
	categories: ToolCategory[],
	path: string[] = []
): { url: string; tool: ToolDefinition }[] {
	const result: { url: string; tool: ToolDefinition }[] = [];

	for (const category of categories) {
		const thisPath = [...path, slugify(category.name)];

		// Add tools directly under this category
		for (const tool of category.tools) {
			const toolSlug = slugify(tool.title);
			const url = "/" + [...thisPath, toolSlug].join("/");
			result.push({ url, tool });
		}

		// Recurse for subcategories
		if (category.subgroups.length > 0) {
			result.push(...generateToolURLs(category.subgroups, thisPath));
		}
	}

	return result;
}