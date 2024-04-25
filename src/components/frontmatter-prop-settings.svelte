<script lang="ts">
	import { flip } from "svelte/animate";
	import { quintOut } from "svelte/easing";
	import { crossfade } from "svelte/transition";
	import { FrontMatterProp, sortFrontMatterItems, validateFrontMatterProps } from "../frontmatter";

	const [send, receive] = crossfade({ duration: 350 });

	export let props: FrontMatterProp[];
	export let onValidate: (props: FrontMatterProp[]) => void;
	$: sortFrontMatterItems(props);

	// populate, then make reactive.
	let inputsVisible = new Array(props.length);
	$: inputsVisible;

	// making validation reactive helps with errors but also spams the save settings function.
	// might become an issue when there are lots of properties to deal with.
	$: validationErrors = validateFrontMatterProps(props);
	$: {
		const hasErrorsCount = validationErrors
			.map((val) => val.hasErrors)
			.filter((val) => val === true).length;
		if (hasErrorsCount === 0) onValidate(props);
	}

	$: tooltips = props.map((prop) => {
		return {
			enabled: `${prop.enabled ? "Check to include" : "Uncheck to ignore"} this property`,
			key: `Property name saved to notes.${prop.defaultKey ? " Default: " + prop.defaultKey : ""}`,
		};
	});

	const toggleInputVisibility = (idx: number) => {
		if (getValidationErrors(idx).length == 0)
			inputsVisible[idx] = !inputsVisible[idx];
	};

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

	const addItem = () => {
		const id = (Math.random() + 1).toString(36).substring(7);
		const newProp = new FrontMatterProp({
			id: id,
			key: id,
			idx: props.length,
			enabled: true,
			custom: true,
		});
		inputsVisible.push(true);
		props.push(newProp);
		// trigger svelte reactivity
		props = props;
	};

	const deleteItem = (idx: number) => {
		toggleInputVisibility(idx);
		props.remove(props[idx]);
		props.forEach((v, i) => {
			if (i >= idx) {
				v.idx -= 1;
			}
		});
		// manually trigger the save operation
		// onValidate(props);
		props = props;
	};

	const getDisabledClass = (idx: number) =>
		props[idx].enabled === false ? "disabled" : "";

	const getInvalidClass = (idx: number) =>
		validationErrors[idx].format.length > 0 ? "validation-error" : "";

	const getValidationErrors = (idx: number) => [
		...validationErrors[idx].format,
		...validationErrors[idx].key,
	];
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">Manage properties</div>
		<div class="setting-item-description">
			Define how properties are ordered, formatted, and written.
		</div>
	</div>
</div>

{#each props as prop, idx (prop.id)}
	<div
		class="setting-item mod-prop"
		data-id={prop.id}
		animate:flip={{ delay: 50, duration: 350, easing: quintOut }}
		in:send={{ key: prop.id }}
		out:receive={{ key: prop.id }}
	>
		<div class="top-section">
			<!-- Ordering buttons -->
			<!-- <div class="shifter"> -->
			{#if idx != 0}
				<button
					class="shift up {idx == props.length - 1 ? 'only' : ''}"
					on:click={() => swapSettings(idx, idx - 1)}
				></button>
			{/if}
			{#if idx != props.length - 1}
				<button
					class="shift down {idx == 0 ? 'only' : ''}"
					on:click={() => swapSettings(idx, idx + 1)}
				></button>
			{/if}
			<!-- </div> -->

			<div class="setting-item-info">
				<div class="setting-item-name {getDisabledClass(idx)}">
					{prop.key}
				</div>
				<div class="setting-item-description {getDisabledClass(idx)}">
					{prop.description || ""}
				</div>
			</div>

			<!-- Edit/Close buttons -->
			<button
				class="edit {inputsVisible[idx] ? 'mod-cta' : ''}"
				title={inputsVisible[idx] ? "Close" : "Edit"}
				disabled={getValidationErrors(idx).length > 0}
				on:click={() => toggleInputVisibility(idx)}
			>
				{inputsVisible[idx] ? "Close" : "Edit"}
			</button>
		</div>

		<div
			id={`input-section-${idx}`}
			class="input-section {inputsVisible[idx] ||
			getValidationErrors(idx).length > 0
				? 'visible'
				: ''}"
		>
			<div class="validation-error">
				{getValidationErrors(idx).join("\n").trim()}
			</div>

			<!-- Enable -->
			<div class="setting-item mod-toggle">
				<div class="setting-item-info">
					<div class="setting-item-name">Enable property</div>
					<div class="setting-item-description">
						Turning this property off will prevent Slurp from
						parsing and writing it to new notes.
					</div>
				</div>
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
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

			<!-- Key -->
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

			<!-- Format -->
			<div class="setting-item">
				<div class="setting-item-info">
					<div class="setting-item-name">Format template</div>
					<div class="setting-item-description">
						<!-- {getInvalidClass(idx)} -->
						<!-- {getFormatDescription(idx)} -->
						String templates start with "s|" and use {"{"}s{"}"}
						as replacement placeholders. Date templates start with "d|"
						and use Moment.js formatting. Booleans properties can be
						created with either "b|true" or "b|false".
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
							Helpful text to display in settings. Not written to
							notes.
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
							on:click={() => deleteItem(idx)}
						>
							Delete
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/each}

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="new-property" title="New Property" on:click={addItem}>
	<span style="margin-right:0.6em">New Property</span>
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
	.mod-prop {
		display: flex;
		align-self: center;
		margin: 0.8em 0;
		flex-direction: column;
		padding: 0.25em 0;
		/* list-style: none; */
		background-color: transparent;
		overflow: hidden; /* ensure transitions aren't wonky as children are shown/hidden */
		border: none;
	}

	/* layout */
	.mod-prop > *,
	.mod-prop .top-section > * {
		align-self: center;
	}

	.mod-prop .input-section > *,
	.mod-prop .top-section > * {
		border: none;
	}

	.mod-prop .top-section {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.mod-prop .top-section > .setting-item-info {
		width: 80%;
	}

	.mod-prop .input-section {
		display: flex;
		flex-direction: column;
		width: 100%;
		overflow: hidden;
		max-height: 0;
		transition:
			max-height 0.15s ease,
			margin 0.3s ease;
	}

	.mod-prop .input-section.visible {
		margin: 1.6em 0;
		/* setting this high to avoid contents being cut off. 
		without it, the hidden input area never grows. */
		max-height: 1350px;
	}

	/* ordering controls */
	.mod-prop .shift {
		color: var(--text-accent-normal);
		font-size: medium;
		width: 6%;
	}

	.mod-prop .shift:hover {
		color: var(--text-accent-hover);
	}

	.mod-prop .up {
		margin: 0 0 0 0.6em;
		border-radius: var(--button-radius) 0 0 var(--button-radius);
	}
	.mod-prop .up::after {
		content: "↑";
	}

	.mod-prop .down {
		margin: 0 0.6em 0 0;
		border-radius: 0 var(--button-radius) var(--button-radius) 0;
	}
	.mod-prop .down::after {
		content: "↓";
	}

	.mod-prop .only {
		width: 12%;
		margin: 0 0.6em;
		border-radius: var(--button-radius);
	}

	/* input controls */
	.mod-prop .edit {
		width: 65px;
	}

	.mod-prop .disabled,
	.mod-prop input:disabled {
		color: var(--text-muted);
		opacity: 50%;
	}

	.mod-prop .validation-error,
	.mod-prop .validation-error {
		color: var(--text-error);
	}

	.mod-prop div.validation-error {
		font-size: small;
		text-align: center;
		margin: 0.75em 0;
	}

	.mod-prop div.validation-error.hidden {
		color: transparent;
		background-color: transparent;
	}

	/* new property button */
	#new-property {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 1.5em auto;
		width: 20%;
		padding: 0.4em;
		border-radius: var(--button-radius);
		border-width: var(--border-width) solid transparent;
		transition:
			color 0.2s,
			border-color 0.2s,
			background-color 0.2s;
	}

	#new-property:hover {
		color: var(--text-accent-hover);
		background-color: var(--background-modifier-hover);
		border-color: var(--background-modifier-border-hover);
	}
</style>
