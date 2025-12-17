<script lang="ts">
	import TextInput from "$lib/components/ui/text-input.svelte";
	import QRCode from "qrcode";

	let text = $state("");
	let caption = $state("");
	let visible = $state(false);

	let canvas: HTMLCanvasElement;

	$effect(() => {
		(async () => {
			if (!text.trim()) {
				visible = false;
				caption = "";
				return;
			}

			try {
				await QRCode.toCanvas(canvas, text, {
					width: 256,
					margin: 2
				});
				visible = true;
				caption = "Click QR to download";

			} catch (e) {
				console.error(e);
				caption = "There was an error trying to generate the QR code.";
			}
		})();
	});


	function downloadQR() {
		if (!text.trim()) return;

		const link = document.createElement("a");
		link.href = canvas.toDataURL("image/png");
		link.download = "qr-code.png";
		link.click();
	}
</script>

<TextInput
	bind:value={text}
	label="Enter a text or URL"
	placeholder="https://example.com"
/>

<div class="flex flex-col items-center">
	<canvas
		bind:this={canvas}
		width="256"
		height="256"
		onclick={downloadQR}
		class="
			cursor-pointer
			transition-opacity {visible ? 'opacity-100' : 'opacity-0'}
		"
	></canvas>
</div>

<p class="
	text-xs
	h-1
	text-center
	transition-opacity {visible ? 'opacity-100' : 'opacity-0'}"
>{caption}</p>
