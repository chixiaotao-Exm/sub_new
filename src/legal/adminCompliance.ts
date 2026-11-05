const documents = import.meta.glob('./admin-compliance.*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

/** All bundled translations refer to the same canonical document version. */
export function getAdminComplianceDocument(locale: string): string {
  return documents[`./admin-compliance.${locale}.md`] || documents['./admin-compliance.en.md']
}
