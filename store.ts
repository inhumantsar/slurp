import { writable } from "svelte/store";
import type { SlurpPropSetting } from "types";

let propSettings = writable<SlurpPropSetting[]>();

export default { propSettings };
