import React, { useContext, useEffect } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { OrderContext } from '../context/orderContext'

const isValidTableNumber = (value) => /^\d+$/.test(String(value || '').trim())

function CustomerTableGuard({ children }) {
  const orderContextValue = useContext(OrderContext)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const tableFromQuery = String(searchParams.get('table') || '').trim()
  const tableFromContext = String(orderContextValue?.tableNumber || '').trim()
  const tableFromStorage = String(localStorage.getItem('tableNumber') || '').trim()

  const resolvedTable = [tableFromQuery, tableFromContext, tableFromStorage].find((tableValue) =>
    isValidTableNumber(tableValue)
  )

  useEffect(() => {
    if (
      resolvedTable &&
      orderContextValue?.updateTableNumber &&
      resolvedTable !== tableFromContext
    ) {
      orderContextValue.updateTableNumber(resolvedTable)
    }
  }, [resolvedTable, tableFromContext, orderContextValue])

  if (!resolvedTable) {
    return <Navigate to="/?tableRequired=1" replace />
  }

  if (!isValidTableNumber(tableFromQuery) || tableFromQuery !== resolvedTable) {
    const normalizedParams = new URLSearchParams(searchParams)
    normalizedParams.set('table', resolvedTable)

    return <Navigate to={`${location.pathname}?${normalizedParams.toString()}`} replace />
  }

  return children
}

export default CustomerTableGuard
