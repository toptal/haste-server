export interface KeyGenerator {
  type: string
  createKey?: (a: number) => string
}
