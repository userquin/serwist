import { writable } from "svelte/store";

import type { TwoslashProps } from "$lib/types";

export const twoslash = writable<TwoslashProps>({
  id: undefined,
  html: undefined,
  bottom: false,
  right: false,
  x: undefined,
  y: undefined,
  closeTooltip: undefined!,
  timeout: undefined,
});