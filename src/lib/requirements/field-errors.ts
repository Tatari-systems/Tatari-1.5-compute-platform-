import type { FieldError, FieldErrors, FieldValues } from "react-hook-form";
import type { ZodError } from "zod";

export type FieldErrorMap = Record<string, string[]>;

export function fieldErrorsFromZod(error: ZodError): FieldErrorMap {
  const fieldErrors: FieldErrorMap = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "form";
    const messages = fieldErrors[path] ?? [];
    messages.push(issue.message);
    fieldErrors[path] = messages;
  }

  return fieldErrors;
}

export function toHookFormErrors<TFieldValues extends FieldValues>(
  error: ZodError,
): FieldErrors<TFieldValues> {
  const errors: Record<string, unknown> = {};

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      errors.root = { type: issue.code, message: issue.message };
      continue;
    }

    let cursor = errors;

    for (let index = 0; index < issue.path.length; index += 1) {
      const key = String(issue.path[index]);
      const isLeaf = index === issue.path.length - 1;

      if (isLeaf) {
        const existing = cursor[key] as FieldError | undefined;
        if (!existing?.message) {
          cursor[key] = { type: issue.code, message: issue.message };
        }
        continue;
      }

      const next = cursor[key];
      if (!next || typeof next !== "object" || "message" in next) {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }
  }

  return errors as FieldErrors<TFieldValues>;
}
