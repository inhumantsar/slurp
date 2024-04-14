import { writable } from "svelte/store";
import { SlurpProp } from "types";

let slurpProps = writable<SlurpProp<any>[]>();

export default { slurpProps };
