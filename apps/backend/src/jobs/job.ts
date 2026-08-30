export interface Job { readonly name: string; run(signal: AbortSignal): Promise<void>; }
