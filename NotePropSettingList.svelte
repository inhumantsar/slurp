<script lang="ts">
	import { validateSlurpProps } from "validate";
	import { SlurpProp, type IFormatterArgs } from "types";
	import { flip } from "svelte/animate";
	import { crossfade } from "svelte/transition";
	import { elasticOut } from "svelte/easing";
	import { formatDate, formatString, formatStrings } from "formatters";
	import { sortSlurpProps } from "./util";
	import { Delete } from "lucide-svelte";

	export let props: Array<SlurpProp<any>>;
	export let onValidate: (props: Array<SlurpProp<any>>) => void;

	$: sortSlurpProps(props);

	const inputsVisible = props.map(() => false);
	$: validationErrors = validateSlurpProps(props, onValidate);
	$: formatErrors = validationErrors.map((errObj, idx) =>
		errObj.format.join(" ").trim(),
	);
	$: keyErrors = validationErrors.map((errObj) =>
		errObj.key.join(" ").trim(),
	);
	$: validationErrorText = [...formatErrors, ...keyErrors].join(" ").trim();
	$: tooltips = props.map((prop) => {
		return {
			enabled: `${prop.enabled ? "Check to include" : "Uncheck to ignore"} this property`,
			key: `Property name saved to notes.${prop.defaultKey ? " Default: " + prop.defaultKey : ""}`,
		};
	});

	$: {
		props.forEach((prop, idx) => {
			if (formatErrors[idx].length > 0 || keyErrors[idx].length > 0)
				inputsVisible[idx] = true;
		});
	}

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
		inputsVisible[idx] = !inputsVisible[idx];
	};

	const [send, receive] = crossfade({ duration: 350, easing: elasticOut });

	const toggleEnabled = (idx: number) => {
		console.log(props[idx].enabled);
		props[idx].enabled = !props[idx].enabled;
		console.log(props[idx].enabled);
	};

	const swapSettings = (from: number, to: number) => {
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
		console.log(newProp);
		inputsVisible.push(true);
		props.push(newProp);
		// trigger svelte reactivity
		props = props;
	};

	const deleteProp = (idx: number) => {
		console.log(`del idx ${idx} // id ${props[idx].id}`);
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
</script>

<div id="validation-errors">{validationErrorText || ""}</div>
<div id="prop-settings">
	{#each props as prop, idx (prop.id)}
		<div
			class="prop-setting setting-item"
			data-id={prop.id}
			animate:flip={{ delay: 50, duration: 350, easing: elasticOut }}
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
					<div class="setting-item-name">{prop.key}</div>
					<div
						class="setting-item-description {getDisabledClass(idx)}"
					>
						{prop.description || ""}
					</div>
				</div>
				<button
					class="mod-cta {inputsVisible[idx] ? 'active' : ''}"
					on:click={() => toggleInputVisibility(idx)}
					title="Close"
				>
					{inputsVisible[idx] ? "Close" : "Edit"}
				</button>
			</div>
			<div
				id={`input-section-${idx}`}
				class="input-section {inputsVisible[idx] ? 'visible' : ''}"
			>
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
						>
							<input
								type="checkbox"
								on:click={() => toggleEnabled(idx)}
								id={prop.id}
							/>
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
							class="prop-key {keyErrors[idx]
								? 'validation-error'
								: ''}"
							title={tooltips[idx].key}
							placeholder={prop.defaultKey || ""}
							disabled={prop.enabled === false}
							bind:value={prop.key}
						/>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-item-info">
						<div class="setting-item-name">Format template</div>
						<div class="setting-item-description">
							String templates start with "s|" and use {"{"}s{"}"}
							as replacement placeholders. Date templates start with
							"d|" and use Moment.js formatting.
						</div>
					</div>
					<div class="setting-item-control">
						<input
							id="prop-format-{prop.id}"
							type="text"
							class={formatErrors[idx] ? "validation-error" : ""}
							placeholder={prop.defaultFormat || "Add format"}
							bind:value={prop.format}
						/>
					</div>
				</div>
				{#if prop.custom}
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
<div id="new-prop">
	<button class="new-button" title="New" on:click={addNewProp}>
		<span style="margin-right:0.6em">Create</span>
		<svg
			viewBox="0 0 45.402 45.402"
			height="15"
			width="15"
			fill="currentColor"
		>
			<path
				d="M41.267,18.557H26.832V4.134C26.832,1.851,24.99,0,22.707,0c-2.283,0-4.124,1.851-4.124,4.135v14.432H4.141
			c-2.283,0-4.139,1.851-4.138,4.135c-0.001,1.141,0.46,2.187,1.207,2.934c0.748,0.749,1.78,1.222,2.92,1.222h14.453V41.27
			c0,1.142,0.453,2.176,1.201,2.922c0.748,0.748,1.777,1.211,2.919,1.211c2.282,0,4.129-1.851,4.129-4.133V26.857h14.435
			c2.283,0,4.134-1.867,4.133-4.15C45.399,20.425,43.548,18.557,41.267,18.557z"
			/>
		</svg>
	</button>
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
		margin: 1em 0;
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

	.prop-input {
		width: 10em;
		text-align: left;
		margin: 0 0.3em;
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

	.mod-cta.active {
		background-color: var(--interactive-normal);
	}

	.new-button {
		margin-top: 0.6em;
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
		max-height: 350px;
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
	.shifter:hover {
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

	.validation-error {
		background-color: darkred;
	}

	.prop-setting > *,
	.top-section > * {
		align-self: center;
	}
</style>
