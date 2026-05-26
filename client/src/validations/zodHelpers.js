export function issuesToFieldErrors(issues) {
  const errors = {}

  for (const issue of issues || []) {
    const key = issue.path?.[0]
    if (key && !errors[key]) {
      errors[key] = issue.message
    }
  }

  return errors
}
