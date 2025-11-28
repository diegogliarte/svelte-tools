export async function copy(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.warn("Clipboard copy failed:", err);
		return false;
	}
}
