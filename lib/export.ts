export type CsvValue = string | number | null | undefined

const escapeCsvValue = (value: CsvValue) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export const toCsv = (rows: CsvValue[][]) => {
  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

export const downloadContent = (filename: string, content: string, mimeType: string) => {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const downloadHtmlAsExcel = (filename: string, html: string) => {
  downloadContent(filename, html, 'application/vnd.ms-excel')
}

export const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const buildHtmlTable = (headers: string[], rows: CsvValue[][]) => {
  const headCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const bodyRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => `<td>${escapeHtml(cell === null || cell === undefined ? '' : String(cell))}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  return `<table border="1" cellspacing="0" cellpadding="4"><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
}

export const openPrintWindow = (title: string, html: string) => {
  if (typeof window === 'undefined') return
  const printWindow = window.open('', '_blank', 'width=960,height=720')
  if (!printWindow) return
  printWindow.document.write(`<!doctype html><html><head><title>${title}</title></head><body>`)
  printWindow.document.write(html)
  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
