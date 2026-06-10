/** Client-safe API error string → translation key mapping. */

export const API_ERROR_KEYS: Record<string, string> = {
  Unauthorized: "apiErrors.unauthorized",
  Forbidden: "apiErrors.forbidden",
  "Invalid input": "apiErrors.invalidInput",
  "Failed to load dashboard": "apiErrors.loadFailed",
  "Email already registered": "apiErrors.emailRegistered",
  "Invalid verification code": "apiErrors.invalidCode",
  "Invalid or expired code": "apiErrors.invalidCode",
  "User not found": "apiErrors.userNotFound",
  "Invalid credentials": "apiErrors.invalidCredentials",
  "Account suspended": "apiErrors.accountSuspended",
  "Insufficient wallet balance": "apiErrors.insufficientBalance",
  "Invalid account": "apiErrors.invalidAccount",
  "Investment failed": "apiErrors.investmentFailed",
  "Failed": "apiErrors.genericFailed",
  "Submission failed": "apiErrors.submissionFailed",
  "Application failed": "apiErrors.applicationFailed",
};

export function translateApiErrorMessage(
  message: string,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const key = API_ERROR_KEYS[message];
  return key ? t(key) : message;
}
