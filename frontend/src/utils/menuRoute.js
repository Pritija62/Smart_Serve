export const buildMenuRoute = (tableNumber) => {
  const normalizedTable = String(tableNumber || '').trim()

  if (!normalizedTable) {
    return '/menu'
  }

  return `/menu?table=${encodeURIComponent(normalizedTable)}`
}