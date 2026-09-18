/** Small runtime type guards so the codebase never needs `any`. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function optionalString(value: unknown): string | null {
  return isString(value) && value.trim().length > 0 ? value : null;
}

export function optionalNumber(value: unknown): number | null {
  if (isNumber(value)) return value;
  if (isString(value) && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function optionalBoolean(value: unknown): boolean | null {
  return isBoolean(value) ? value : null;
}

export function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isString).map((s) => s.trim()).filter((s) => s.length > 0);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isString(error)) return error;
  return 'Unknown error';
}
