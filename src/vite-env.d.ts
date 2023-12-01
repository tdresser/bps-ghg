/// <reference types="vite/client" />

declare module '*.csv.gz' {
    const src: string
    export default src
}