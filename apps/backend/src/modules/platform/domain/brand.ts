export type Brand<Value, Name extends string> = Value & { readonly __platformBrand: Name };
