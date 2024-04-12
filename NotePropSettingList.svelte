<script lang="ts">
	import store from "store";
	import type { SlurpPropSetting } from "types";

	const getSortedPropSettings = (p: SlurpPropSetting[]) => p.sort((a, b) => a.idx - b.idx);

	let propSettings: SlurpPropSetting[];
	store.propSettings.subscribe((p) => propSettings = getSortedPropSettings(p));

	const toggleEnabled = (prop: SlurpPropSetting) => {
		propSettings.forEach(e => {
			if (prop.id == e.id) e.enabled = !prop.enabled;
		});
		store.propSettings.set(propSettings);
	};

	const swapSettings = (from: number, to: number) => {
		console.log(`swapping ${propSettings[from].id} (${propSettings[from].idx}) and ${propSettings[to].id} (${propSettings[to].idx})`)
		propSettings[from].idx = to
		propSettings[to].idx = from;
		console.log(`swapped ${propSettings[from].id} (${propSettings[from].idx}) and ${propSettings[to].id} (${propSettings[to].idx})`)
		store.propSettings.set(propSettings);
	};


</script>

<div id="prop-settings">
	{#each propSettings as prop}
		<div class="prop-setting" data-id={prop.id}>
			<!-- <div class="shifters"> -->
				{#if prop.idx != 0}
				<button class="shifter up {prop.idx == propSettings.length-1 ? 'only' : ''}" on:click={() => swapSettings(prop.idx, prop.idx-1)}></button>
				{/if}
				{#if prop.idx != propSettings.length-1}
				<button class="shifter down {prop.idx == 0 ? 'only' : ''}" on:click={() => swapSettings(prop.idx, prop.idx+1)}></button>
				{/if}
			<!-- </div> -->
			<input type="checkbox" class="prop-enable" title="{prop.enabled ? 'Check to include' : 'Uncheck to ignore'} this property"
				bind:checked={prop.enabled} on:click={() => toggleEnabled(prop)} id={prop.id} />
			<input
				type="text"
				class="prop-input"
				title="Name used for this property. Defaults to '{prop.defaultKey}'"
				placeholder={prop.defaultKey}
				disabled={prop.enabled === false}
				bind:value={prop.key}
			/>
			<div class="right-section">
				<span class="description">{prop.description}</span>
			</div>
		</div>
	{/each}
</div>

<style>
	#prop-settings {
		width: 100%;
	}

	.prop-setting {
		display: flex;
		padding: 0.25em 0;
		list-style: none;
		background-color: transparent;
	}

	.prop-enable {
		margin: 0 0.85em 0 0.75em;
	}

	.prop-input {
		width: 10em;
		text-align: left;
		margin: 0 0.3em;
	}

	.prop-input:disabled {
		color: var(--text-muted);
	}

	.description {
		text-align: left;
		flex-grow: 1;
		margin: 0 0.3em;
		font-size: small;
	}

	.right-section {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-grow: 0;
	}

	.shifter {
		width: 1.8em;
		display: inline-block;
		border: 0 solid var(--background-secondary);
		user-select: none;
	}
	.shifter {
		background-color: var(--background-secondary-alt);
		color: var(--text-accent-normal);
	}
	.shifter:hover {
		/* background-color: var(--background-modifier-hover); */
		color: var(--text-accent-hover);
	}
	.disabled, .disabled:hover, .disabled:focus-visible {
		background-color: var(--background-secondary);
		color: var(--text-accent-normal);
		box-shadow: 0 transparent;
		opacity: 30%;
	}
	.up {
		margin: 0 0 0 0.3em;
		padding: 0 0.3em 0 0.3em;
		border-radius: var(--button-radius) 0 0 var(--button-radius);
	}
	.up::after {
		content: '↑';
	}
	.down {
		margin: 0 0.3em 0 0;
		padding: 0 0.3em 0 0.3em;
		border-radius: 0 var(--button-radius) var(--button-radius) 0;
	}
	.down::after {
		content: '↓';
	}

	.up.only, .down.only {
		width: 3.6em;
		margin: 0 0.3em;
		padding: 0 0.3em;
		border-radius: var(--button-radius);
	}

	.prop-setting > *,
	.right-section > * {
		align-self: center;
	}
</style>
