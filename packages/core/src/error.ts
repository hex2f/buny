/**
 * Custom error class that captures the component call stack for better error reporting.
 * 
 * This error is used during rendering to provide context about which components
 * were being processed when an error occurred, creating a traceable path through
 * the component hierarchy.
 */
export class OriginError extends Error {
  /**
   * Creates a new OriginError with a message and component call stack.
   * 
   * @param message - The error message
   * @param callStack - Array of component names representing the rendering hierarchy
   */
  constructor(message: string, public callStack: string[]) {
    super(message)
  }

  /**
   * Formats the error with the component call stack for display.
   * 
   * @returns A string representation of the error including the component path
   */
  toString() {
    return `${this.callStack.join(' > ')}\n  ${this.message}`
  }
}