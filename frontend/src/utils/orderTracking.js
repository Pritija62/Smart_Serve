const STORAGE_TRACKED_ORDERS_KEY = 'trackedOrders'

const normalizeTableNumber = (tableNumber) => String(tableNumber || '').trim()

const readTrackedOrders = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_TRACKED_ORDERS_KEY)
    if (!storedValue) {
      return {}
    }

    const parsedValue = JSON.parse(storedValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {}
  } catch (err) {
    console.error('Error loading tracked orders:', err)
    return {}
  }
}

const writeTrackedOrders = (trackedOrders) => {
  localStorage.setItem(STORAGE_TRACKED_ORDERS_KEY, JSON.stringify(trackedOrders))
}

export const normalizeTrackedOrder = (order, fallbackTableNumber = '') => {
  const items = (order.items || order.order_items || []).map((item) => ({
    name: item.name || item.menu_item?.name || 'Item',
    quantity: item.quantity || 1,
    price: Number(item.price ?? item.menu_item?.price ?? 0),
  }))

  return {
    orderId: order.orderId ?? order.order_id ?? order.id,
    tableNumber: normalizeTableNumber(order.tableNumber ?? order.table_number ?? fallbackTableNumber),
    totalPrice: Number(order.totalPrice ?? order.total_price ?? 0),
    status: String(order.status || 'PENDING').toUpperCase(),
    createdAt: order.createdAt ?? order.created_at ?? new Date().toISOString(),
    estimatedTime: order.estimatedTime ?? order.estimated_wait_time ?? null,
    items,
  }
}

export const getTrackedOrdersForTable = (tableNumber) => {
  const normalizedTable = normalizeTableNumber(tableNumber)
  if (!normalizedTable) {
    return []
  }

  const trackedOrders = readTrackedOrders()
  return Array.isArray(trackedOrders[normalizedTable]) ? trackedOrders[normalizedTable] : []
}

export const getLatestTrackedOrderForTable = (tableNumber) => {
  const trackedOrders = getTrackedOrdersForTable(tableNumber)
  return trackedOrders[0] || null
}

export const upsertTrackedOrder = (order, fallbackTableNumber = '') => {
  const normalizedOrder = normalizeTrackedOrder(order, fallbackTableNumber)

  if (!normalizedOrder.orderId || !normalizedOrder.tableNumber) {
    return normalizedOrder
  }

  const trackedOrders = readTrackedOrders()
  const tableOrders = Array.isArray(trackedOrders[normalizedOrder.tableNumber])
    ? trackedOrders[normalizedOrder.tableNumber]
    : []

  const nextOrders = [
    normalizedOrder,
    ...tableOrders.filter((existingOrder) => String(existingOrder.orderId) !== String(normalizedOrder.orderId)),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  trackedOrders[normalizedOrder.tableNumber] = nextOrders
  writeTrackedOrders(trackedOrders)

  return normalizedOrder
}
