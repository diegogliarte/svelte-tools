export function capitalize(value?: string): string {
	if (!value) return '';
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function toKebabCase(value?: string): string {
	if (!value) return '';
	return value.toLowerCase().replace(/\s+/g, '-');
}
