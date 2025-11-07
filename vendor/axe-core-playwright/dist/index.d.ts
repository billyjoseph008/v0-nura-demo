declare class AxeBuilder {
  constructor(options?: { page?: unknown })
  analyze(): Promise<{ violations: unknown[] }>
}

export default AxeBuilder
