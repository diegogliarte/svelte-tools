<script lang="ts">
	import type { Snippet } from 'svelte';

	// UI components
	import TextInput from '$lib/components/ui/text-input.svelte';
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import CheckboxInput from '$lib/components/ui/checkbox-input.svelte';
	import CopyButton from '$lib/components/ui/copy-button.svelte';
	import DataTable from '$lib/components/ui/data-table.svelte';
	import LabeledRow from '$lib/components/ui/labeled-row.svelte';
	import LineChart from '$lib/components/ui/line-chart.svelte';
	import ProgressBar from '$lib/components/ui/progress-bar.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import TextArea from '$lib/components/ui/text-area.svelte';
	import Button from '$lib/components/ui/button.svelte';

	// Demo state
	let textValue = $state('');
	let numValue = $state(10);
	let checkValue = $state(false);
	let checkValue2 = $state(true);
	let selectVal = $state('');
	let areaVal = $state('Line 1\nLine 2\nLine 3');

	let tableColumns = [
		{ key: 'id', label: 'ID', width: '50px' },
		{ key: 'name', label: 'Name' },
		{ key: 'age', label: 'Age', sortValue: r => r.age }
	];
	let tableRows = [
		{ id: 1, name: 'Alice', age: 31 },
		{ id: 2, name: 'Bob', age: 28 },
		{ id: 3, name: 'Cindy', age: 44 },
		{ id: 4, name: 'Daniel', age: 22 }
	];

	let lineLabels = ['Jan', 'Feb', 'Mar', 'Apr'];
	let lineSets = [
		{ label: 'Sales', data: [30, 60, 45, 80], color: '#8888FF' },
		{ label: 'Ops', data: [20, 40, 30, 70], color: '#FF8888' }
	];

	let progressValue = 63;

	let selectOptions = [
		{ value: '', label: '—' },
		{ value: 'one', label: 'One' },
		{ value: 'two', label: 'Two' },
		{ value: 'three', label: 'Three' }
	];

	let buttonActive = $state(false);
	let buttonClicks = $state(0);
</script>

<!-- REUSABLE GALLERY CARD SNIPPET -->
{#snippet galleryItem(title: string, Demo: Snippet<[]>, Footer?: Snippet<[]>)}
	<section class="border p-4 flex flex-col gap-2">
		<h2>{title}</h2>

		{@render Demo()}

		{#if Footer}
			<pre class="text-xs flex flex-col">{@render Footer()}</pre>
		{/if}
	</section>
{/snippet}

<!-- INDIVIDUAL DEMO SNIPPETS     -->
{#snippet demoTextInput()}
	<TextInput label="Name" placeholder="Enter name..." bind:value={textValue} />
{/snippet}

{#snippet footerTextInput()}
	value = {textValue}
{/snippet}

{#snippet demoNumberInput()}
	<NumberInput
		label="Count"
		min={0}
		max={50}
		step={5}
		placeholder="10"
		bind:value={numValue}
	/>
{/snippet}

{#snippet footerNumberInput()}
	value = {numValue}
{/snippet}

{#snippet demoCheckbox()}
	<CheckboxInput label="Enable Option" bind:checked={checkValue} />
	<CheckboxInput label="Enable Option 2" bind:checked={checkValue2} />
{/snippet}

{#snippet footerCheckbox()}
	<span>
	checked = {checkValue}
	</span>
	<span>
	checked2 = {checkValue2}
	</span>
{/snippet}

{#snippet demoCopyButton()}
	<div class="flex items-center gap-2">
		<span class="text-sm">Copy: "Hello"</span>
		<CopyButton value="Hello" />
	</div>
{/snippet}

{#snippet demoLabeledRow()}
	<LabeledRow label="Example" value="Demo value" group="demo" valueAlign="left" isCopyable={true} />
	<LabeledRow label="Centered" value="12345" group="demo" valueAlign="center" />
{/snippet}

{#snippet demoSelect()}
	<SelectInput
		label="Pick One"
		options={selectOptions}
		placeholder="—"
		allowEmpty={true}
		bind:value={selectVal}
	/>
{/snippet}

{#snippet footerSelect()}
	value = {selectVal}
{/snippet}

{#snippet demoTextArea()}
	<TextArea
		label="Code"
		displayLines={true}
		bind:value={areaVal}
		placeholder="Enter text..."
	/>
{/snippet}

{#snippet footerTextArea()}
	lines = {areaVal.split('\n').length}
{/snippet}

{#snippet demoDataTable()}
	<DataTable
		columns={tableColumns}
		rows={tableRows}
		pageSize={20}
	/>
{/snippet}

{#snippet demoLineChart()}
	<LineChart
		labels={lineLabels}
		datasets={lineSets}
		preset="number"
		locale="en-US"
		yZero={true}
	/>
{/snippet}

{#snippet demoProgressBar()}
	<ProgressBar
		label="Progress"
		value={progressValue}
		min={0}
		max={100}
		showValue={true}
		segments={[
			{ limit: 25, color: 'green' },
			{ limit: 50, color: 'yellow' },
			{ limit: 75, color: 'blue' },
			{ limit: 100, color: 'red' }
		]}
	/>
{/snippet}

{#snippet demoButton()}
<Button onClick={() => buttonClicks++}>
	Default
</Button>

<Button
	active={buttonActive}
	onClick={() => (buttonActive = !buttonActive)}
>
	{buttonActive ? 'Active' : 'Inactive'}
</Button>

<Button disabled>
	Disabled
</Button>
{/snippet}

{#snippet footerButton()}
	<span>clicks = {buttonClicks}</span>
	<span>active = {buttonActive}</span>
{/snippet}


<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
	{@render galleryItem("TextInput", demoTextInput, footerTextInput)}
	{@render galleryItem("NumberInput", demoNumberInput, footerNumberInput)}
	{@render galleryItem("SelectInput", demoSelect, footerSelect)}
	{@render galleryItem("CheckboxInput", demoCheckbox, footerCheckbox)}
	{@render galleryItem("LabeledRow", demoLabeledRow)}
	{@render galleryItem("CopyButton", demoCopyButton)}
	{@render galleryItem("TextArea", demoTextArea, footerTextArea)}
	{@render galleryItem("DataTable", demoDataTable)}
	{@render galleryItem("LineChart", demoLineChart)}
	{@render galleryItem("ProgressBar", demoProgressBar)}
	{@render galleryItem("Button", demoButton, footerButton)}

</div>
