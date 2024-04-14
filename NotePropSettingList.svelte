<script lang="ts">
	import store from "store";
	import { SlurpProp } from "types";
	import { flip } from "svelte/animate";
	import { crossfade } from "svelte/transition";
	import { elasticOut } from "svelte/easing";

	const sortProps = (p: SlurpProp<any>[]) => {
		p.sort((a, b) => a.idx - b.idx);
	};

	const propKeys = new Map<string, string>();
	let props: Array<SlurpProp<any>>;
	store.slurpProps.subscribe((p) => {
		if (!props) {
			props = p;
		}
		sortProps(props);
		// make temp copies of keys so validation can be applied
		props.forEach((v) => {
			propKeys.set(v.id, v.key);
		});
	});

	const save = () => store.slurpProps.set(props);

	const [send, receive] = crossfade({ duration: 350, easing: elasticOut });

	const toggleEnabled = (prop: SlurpProp<any>) => {
		props.forEach((e) => {
			if (prop.id == e.id) e.enabled = !prop.enabled;
		});
		save();
	};

	const swapSettings = (from: number, to: number) => {
		props[from].idx = to;
		props[to].idx = from;
		save();
	};

	const saveKey = (prop: SlurpProp<any>) => {
		prop.key = prop.key.trim();
		save();
	};

	const setValidationError = (err: string | null) => {
		const ele = document.getElementById(
			"validation-errors",
		) as HTMLDivElement;
		if (!ele) return;

		if (err) {
			ele.classList.remove("hidden");
			ele.textContent = err;
		} else {
			ele.classList.add("hidden");
			ele.textContent = "";
		}
	};

	const isKeyValid = (v: string | undefined) => {
		if (v?.match(/[{}\[\],&*#?|\-<>=!%@]/g) !== null) {
			setValidationError(
				"ERROR: Property keys cannot contain the following characters: {}[],&*#?|-<>=!%@",
			);
			return false;
		} else {
			setValidationError(null);
			return true;
		}
	};

	const getTooltip = (prop: SlurpProp<any>, setting: string) => {
		switch (setting) {
			case "enabled":
				return `${prop.enabled ? "Check to include" : "Uncheck to ignore"} this property`;
			case "key":
				const def = prop.defaultKey
					? ` Defaults to "${prop.defaultKey}"`
					: "";
				const err = isKeyValid(prop.key)
					? null
					: " ERROR: Cannot contain the following characters: {}[],&*#?|-<>=!%@";
				return err || `Name used for this property.${def}`;
			default:
				break;
		}
	};
</script>

<div id="validation-errors" class="hidden"></div>
<div id="prop-settings">
	{#each props as prop (prop.id)}
		<div
			class="prop-setting"
			data-id={prop.id}
			animate:flip={{ delay: 50, duration: 350, easing: elasticOut }}
			in:send={{ key: prop.id }}
			out:receive={{ key: prop.id }}
		>
			{#if prop.idx != 0}
				<button
					class="shifter up {prop.idx == props.length - 1
						? 'only'
						: ''}"
					on:click={() => swapSettings(prop.idx, prop.idx - 1)}
				></button>
			{/if}
			{#if prop.idx != props.length - 1}
				<button
					class="shifter down {prop.idx == 0 ? 'only' : ''}"
					on:click={() => swapSettings(prop.idx, prop.idx + 1)}
				></button>
			{/if}

			<input
				type="checkbox"
				class="prop-enable"
				title={getTooltip(prop, "enabled")}
				bind:checked={prop.enabled}
				on:click={() => toggleEnabled(prop)}
				id={prop.id}
			/>

			<input
				type="text"
				class="prop-input {isKeyValid(prop.key) || 'validation-error'}"
				title={getTooltip(prop, "key")}
				placeholder={prop.defaultKey || ""}
				disabled={prop.enabled === false}
				on:input={() => isKeyValid(prop.key)}
				bind:value={prop.key}
				on:blur={() =>
					isKeyValid(prop.key)
						? saveKey(prop)
						: (prop.key = propKeys.get(prop.id) || "")}
			/>

			<div class="right-section">
				<span
					class="description {prop.enabled === false
						? 'disabled'
						: ''}">{prop.description || ""}</span
				>
			</div>
		</div>
	{/each}
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
	.prop-input:disabled,
	.disabled {
		color: var(--text-muted);
		opacity: 50%;
	}
	.up {
		margin: 0 0 0 0.3em;
		padding: 0 0.3em 0 0.3em;
		border-radius: var(--button-radius) 0 0 var(--button-radius);
	}
	.up::after {
		content: "↑";
	}
	.down {
		margin: 0 0.3em 0 0;
		padding: 0 0.3em 0 0.3em;
		border-radius: 0 var(--button-radius) var(--button-radius) 0;
	}
	.down::after {
		content: "↓";
	}

	.up.only,
	.down.only {
		width: 3.6em;
		margin: 0 0.3em;
		padding: 0 0.3em;
		border-radius: var(--button-radius);
	}

	.validation-error {
		background-color: darkred;
	}

	.prop-setting > *,
	.right-section > * {
		align-self: center;
	}
</style>
