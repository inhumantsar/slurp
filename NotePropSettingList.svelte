<script lang="ts">
	import { validateSlurpProps } from "validate";
	import { SlurpProp, type IFormatterArgs } from "types";
	import { flip } from "svelte/animate";
	import { crossfade, slide } from "svelte/transition";
	import { elasticOut, quintOut } from "svelte/easing";
	import { formatDate, formatString, formatStrings } from "formatters";
	import { sortSlurpProps } from "./util";
	import { writable } from "svelte/store";

	export let props: Array<SlurpProp<any>>;
	export let onValidate: (props: Array<SlurpProp<any>>) => void;

	$: sortSlurpProps(props);

	// const inputsVisible = props.map(() => false);
	let inputsVisible = new Array(props.length);
	$: inputsVisible;
	$: validationErrors = validateSlurpProps(props, onValidate);
	// $: formatErrors = validationErrors.map((errObj, idx) =>
	// 	errObj.format.join(" ").trim(),
	// );
	// $: keyErrors = validationErrors.map((errObj) =>
	// 	errObj.key.join(" ").trim(),
	// );
	// $: validationErrorText = [...formatErrors, ...keyErrors].join(" ").trim();
	$: tooltips = props.map((prop) => {
		return {
			enabled: `${prop.enabled ? "Check to include" : "Uncheck to ignore"} this property`,
			key: `Property name saved to notes.${prop.defaultKey ? " Default: " + prop.defaultKey : ""}`,
		};
	});

	// $: {
	// 	props.forEach((prop, idx) => {
	// 		if (formatErrors[idx].length > 0 || keyErrors[idx].length > 0)
	// 			inputsVisible[idx] = true;
	// 	});
	// }

	// $: formatExamples = props.map((prop) => {
	// 	const fmt = prop.format;
	// 	if (fmt?.startsWith("d|")) return formatDate(fmt, new Date());
	// 	if (fmt?.startsWith("s|")) return formatString(fmt, "myvalue");
	// 	if (fmt?.startsWith("S|")) {
	// 		const matches = fmt.match(/\{(\w+)\}/g);
	// 		const obj = matches?.map(
	// 			(val) =>
	// 				(val
	// 					? Object.fromEntries([[val, `some${val}`]])
	// 					: {}) as IFormatterArgs,
	// 		) || [{} as IFormatterArgs];
	// 		return formatStrings(fmt, obj).join(", ");
	// 	}
	// 	return "";
	// });

	const toggleInputVisibility = (idx: number) => {
		if (propErrors(idx).length == 0)
			inputsVisible[idx] = !inputsVisible[idx];
	};

	const [send, receive] = crossfade({ duration: 350, easing: elasticOut });

	const toggleEnabled = (idx: number) => {
		props[idx].enabled = props[idx].enabled ? false : true;
		onValidate(props);
		props = props;
	};

	const swapSettings = (from: number, to: number) => {
		const fromVis = inputsVisible[from];
		const toVis = inputsVisible[to];
		inputsVisible[to] = fromVis;
		inputsVisible[from] = toVis;
		props[from].idx = to;
		props[to].idx = from;
	};

	const addNewProp = () => {
		const newProp = new SlurpProp({
			id: (Math.random() + 1).toString(36).substring(7),
			idx: props.length,
			enabled: true,
			custom: true,
		});
		inputsVisible.push(true);
		console.log(`pushing new prop: ${newProp.id}`);
		props.push(newProp);
		// trigger svelte reactivity
		props = props;
	};

	const deleteProp = (idx: number) => {
		toggleInputVisibility(idx);
		props.remove(props[idx]);
		props.forEach((v, i) => {
			if (i >= idx) {
				v.idx -= 1;
			}
		});
		onValidate(props);
		props = props;
	};

	const getDisabledClass = (idx: number) =>
		props[idx].enabled === false ? "disabled" : "";

	const getInvalidClass = (idx: number) =>
		validationErrors[idx].format.length > 0 ? "validation-error" : "";

	const getFormatDescription = (idx: number) =>
		validationErrors[idx].format.length > 0
			? validationErrors[idx].format
			: 'String templates start with "s|" and use {s} as replacement placeholders. ' +
				'Date templates start with "d|" and use Moment.js formatting. Booleans properties ' +
				' can be created with either "b|true" or "b|false"';

	const propErrors = (idx: number) => [
		...validationErrors[idx].format,
		...validationErrors[idx].key,
	];
</script>

<div id="prop-settings">
	{#each props as prop, idx (prop.id)}
		<div
			class="prop-setting setting-item"
			data-id={prop.id}
			animate:flip={{ delay: 50, duration: 350, easing: quintOut }}
			in:send={{ key: prop.id }}
			out:receive={{ key: prop.id }}
		>
			<div class="top-section">
				<div class="shifter">
					{#if prop.idx != 0}
						<button
							class="shifter up {prop.idx == props.length - 1
								? 'only'
								: ''}"
							on:click={() =>
								swapSettings(prop.idx, prop.idx - 1)}
						></button>
					{/if}
					{#if prop.idx != props.length - 1}
						<button
							class="shifter down {prop.idx == 0 ? 'only' : ''}"
							on:click={() =>
								swapSettings(prop.idx, prop.idx + 1)}
						></button>
					{/if}
				</div>

				<div class="setting-item-info">
					<div class="setting-item-name {getDisabledClass(idx)}">
						{prop.key}
					</div>
					<div
						class="setting-item-description {getDisabledClass(idx)}"
					>
						{prop.description || ""}
					</div>
				</div>
				<button
					class="mod-cta {inputsVisible[idx] ? 'active' : ''}"
					on:click={() => toggleInputVisibility(idx)}
					disabled={propErrors(idx).length > 0}
					title={inputsVisible[idx] ? "Close" : "Edit"}
				>
					{inputsVisible[idx] ? "Close" : "Edit"}
				</button>
			</div>
			<div
				id={`input-section-${idx}`}
				class="input-section {inputsVisible[idx] ||
				propErrors(idx).length > 0
					? 'visible'
					: ''}"
			>
				<div id="validation-errors">
					{propErrors(idx).join("\n").trim()}
				</div>

				<div class="setting-item mod-toggle">
					<div class="setting-item-info">
						<div class="setting-item-name">Enable property</div>
						<div class="setting-item-description">
							Turning this property off will prevent Slurp from
							parsing and writing it to new notes.
						</div>
					</div>
					<div class="setting-item-control">
						<div
							class="checkbox-container {prop.enabled
								? 'is-enabled'
								: ''}"
							on:click={() => toggleEnabled(idx)}
						>
							<input type="checkbox" id={prop.id} />
						</div>
					</div>
				</div>

				<div class="setting-item">
					<div class="setting-item-info">
						<div class="setting-item-name">Property key</div>
						<div class="setting-item-description">
							{tooltips[idx].key}
						</div>
					</div>
					<div class="setting-item-control">
						<input
							id="prop-key-{prop.id}"
							type="text"
							class="prop-input
							{validationErrors[idx].key.length > 0 ? 'validation-error' : ''}"
							title={tooltips[idx].key}
							placeholder={prop.defaultKey || ""}
							disabled={prop.enabled === false}
							bind:value={prop._key}
						/>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-item-info">
						<div class="setting-item-name">Format template</div>
						<div class="setting-item-description">
							<!-- {getInvalidClass(idx)} -->
							<!-- {getFormatDescription(idx)} -->
							String templates start with "s|" and use {"{"}s{"}"}
							as replacement placeholders. Date templates start with
							"d|" and use Moment.js formatting. Booleans properties
							can be created with either "b|true" or "b|false".
						</div>
					</div>
					<div class="setting-item-control">
						<input
							id="prop-format-{prop.id}"
							type="text"
							class="prop-input {getInvalidClass(idx)}"
							placeholder={prop.defaultFormat || "Add format"}
							disabled={prop.enabled === false}
							bind:value={prop.format}
						/>
					</div>
				</div>
				{#if prop.custom}
					<div class="setting-item">
						<div class="setting-item-info">
							<div class="setting-item-name">Description</div>
							<div class="setting-item-description">
								Helpful text to display in settings. Not written
								to notes.
							</div>
						</div>
						<div class="setting-item-control">
							<input
								id="prop-description-{prop.id}"
								type="text"
								class="prop-input"
								disabled={prop.enabled === false}
								bind:value={prop.description}
							/>
						</div>
					</div>

					<div class="setting-item">
						<div class="setting-item-info">
							<div class="setting-item-name">Delete property</div>
							<div class="setting-item-description">
								Existing notes will not be affected.
							</div>
						</div>
						<div class="setting-item-control">
							<button
								class="mod-warning"
								on:click={() => deleteProp(idx)}
							>
								Delete
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="new-button" title="New" on:click={addNewProp}>
	<span style="margin-right:0.6em">New</span>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="lucide lucide-circle-plus"
		><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path
			d="M12 8v8"
		/></svg
	>
</div>

<style>
	#prop-settings {
		width: 100%;
	}

	#validation-errors {
		font-size: small;
		text-align: center;
		/* height: 1em; */
		/* background-color: var(--background-modifier-error); */
		color: var(--text-error);
		margin: 0.75em 0;
	}

	#validation-errors.hidden {
		color: transparent;
		background-color: transparent;
	}

	.prop-setting.setting-item {
		display: flex;
		align-self: center;
		margin: 0.8em 0;
		flex-direction: column;
		padding: 0.25em 0;
		list-style: none;
		background-color: transparent;
		overflow: hidden; /* ensure transitions aren't wonky as children are shown/hidden */
		border: none;
	}

	.top-section {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.prop-enable {
		margin: 0 0.85em 0 0.75em;
	}

	.prop-input:disabled {
		color: var(--text-muted);
		opacity: 50%;
	}

	.edit-button,
	.new-button {
		/* cursor: pointer; */
		color: var(--text-accent-normal);
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: auto; /* Align the button to the right */
	}

	.edit-button:hover,
	.edit-button.active,
	.new-button:hover,
	.new-button.active {
		color: var(--text-accent-hover);
	}

	.edit-button svg,
	.new-button svg {
		transition: color 0.3s;
	}

	#prop-settings .mod-cta {
		width: 65px;
	}
	.mod-cta.active {
		background-color: var(--interactive-normal);
	}

	.new-button {
		margin-top: 1em;
	}

	.description {
		text-align: left;
		flex-grow: 1;
		margin: 0 0.3em;
		font-size: small;
	}

	.setting-item-info {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		flex-grow: 1;
	}
	.top-section > .setting-item-info {
		width: 80%;
	}

	.input-section {
		width: 100%;
		overflow: hidden;
		max-height: 0;
		transition:
			max-height 0.15s ease,
			margin 0.3s ease;
	}

	.input-section > *,
	.top-section > * {
		border: none;
	}

	.input-section.visible {
		margin: 2.3em 0;
		/* setting this high to avoid contents being cut off. without it, the hidden input area
		never grows */
		max-height: 1350px;
	}

	.shifter {
		/* width: 1.8em; */
		/* display: block; */
		justify-content: center;
		display: flex;
		width: 15%;
		align-items: center;
		border: 0 solid var(--background-secondary);
		user-select: none;
		/* background-color: var(--background-secondary-alt); */
		color: var(--text-accent-normal);
		margin: 0 0.3em;
		font-size: medium;
	}

	.up:hover,
	.down:hover {
		/* background-color: var(--background-modifier-hover); */
		color: var(--text-accent-hover);
	}
	.disabled {
		color: var(--text-muted);
		opacity: 50%;
	}
	.up {
		width: auto;
		margin: 0 0 0 0.3em;
		/* padding: 0 0.3em 0 0.3em; */
		border-radius: var(--button-radius) 0 0 var(--button-radius);
	}
	.up::after {
		content: "↑";
	}
	.down {
		width: auto;
		margin: 0 0.3em 0 0;
		/* padding: 0 0.3em 0 0.3em; */
		border-radius: 0 var(--button-radius) var(--button-radius) 0;
	}
	.down::after {
		content: "↓";
	}

	.up.only,
	.down.only {
		width: 70%;
		margin: 0 0.3em;
		padding: 0 0.3em;
		border-radius: var(--button-radius);
	}

	input.validation-error {
		color: var(--text-error);
	}

	.prop-setting > *,
	.top-section > * {
		align-self: center;
	}
</style>
