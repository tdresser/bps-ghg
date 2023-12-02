export function fail(): never {
    throw new Error("missing element");
}

export function yieldy() {
    return new Promise(resolve => setTimeout(resolve, 0));
}