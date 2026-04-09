export const buildMenuRoute = (tableNumber) => {
  const normalizedTable = String(tableNumber || '').trim()

  if (!normalizedTable) {
    return '/menu'
  }

  return `/menu?table=${encodeURIComponent(normalizedTable)}`
}

export const buildTableRoute = (path, tableNumber) => {
  const normalizedTable = String(tableNumber || '').trim()

  if (!normalizedTable) {
    return path
  }

  return `${path}?table=${encodeURIComponent(normalizedTable)}`
}