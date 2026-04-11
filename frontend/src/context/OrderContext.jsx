import React, { createContext, useState, useEffect } from 'react'

// Create the context
export const OrderContext = createContext()

const STORAGE_TABLE_KEY = 'tableNumber'
const STORAGE_TABLE_CARTS_KEY = 'tableCarts'
const LEGACY_CART_KEY = 'cart'

const getStoredTableCarts = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_TABLE_CARTS_KEY)
    if (!storedValue) {
      return {}
    }

    const parsedValue = JSON.parse(storedValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {}
  } catch (err) {
    console.error('Error loading table carts:', err)
    return {}
  }
}

const saveStoredTableCarts = (tableCarts) => {
  localStorage.setItem(STORAGE_TABLE_CARTS_KEY, JSON.stringify(tableCarts))
}

// Create the provider component
export const OrderProvider = ({ children }) => {
  // State variables
  const [cartItems, setCartItems] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalQuantity, setTotalQuantity] = useState(0)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedTable = localStorage.getItem(STORAGE_TABLE_KEY)
    const tableCarts = getStoredTableCarts()
    const legacyCart = localStorage.getItem(LEGACY_CART_KEY)

    if (savedTable) {
      setTableNumber(savedTable)

      if (Array.isArray(tableCarts[savedTable])) {
        setCartItems(tableCarts[savedTable])
        return
      }
    }

    if (legacyCart) {
      try {
        const parsedLegacyCart = JSON.parse(legacyCart)
        if (Array.isArray(parsedLegacyCart)) {
          setCartItems(parsedLegacyCart)
        }
      } catch (err) {
        console.error('Error loading legacy cart:', err)
      }
    }
  }, [])

  // Load the selected table's cart whenever table changes.
  useEffect(() => {
    if (!tableNumber) {
      return
    }

    const tableCarts = getStoredTableCarts()
    setCartItems(Array.isArray(tableCarts[tableNumber]) ? tableCarts[tableNumber] : [])
  }, [tableNumber])

  // Save cart for the currently selected table whenever it changes.
  useEffect(() => {
    if (!tableNumber) {
      localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(cartItems))
      return
    }

    const tableCarts = getStoredTableCarts()

    if (cartItems.length > 0) {
      tableCarts[tableNumber] = cartItems
    } else {
      delete tableCarts[tableNumber]
    }

    saveStoredTableCarts(tableCarts)
    localStorage.removeItem(LEGACY_CART_KEY)
  }, [cartItems, tableNumber])

  // Save table number to localStorage whenever it changes
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem(STORAGE_TABLE_KEY, tableNumber)
    }
  }, [tableNumber])

  // Calculate totals whenever cart changes
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity
    }, 0)

    const quantity = cartItems.reduce((sum, item) => {
      return sum + item.quantity
    }, 0)

    setTotalPrice(total)
    setTotalQuantity(quantity)
  }, [cartItems])

  // Add item to cart
  const addToCart = (item) => {
    console.log("adding to cart",item)
    setCartItems((prevItems) => {
      // Check if item already exists in cart
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id)

      if (existingItem) {
        // Item exists: increase quantity
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
            : cartItem
        )
      } else {
        // Item doesn't exist: add new item
        return [...prevItems, { ...item, quantity: item.quantity || 1 }]
      }
    })
    console.log("item added to cart")
  }

  // Remove item from cart
  const removeFromCart = (itemId) => {
    console.log("remove from cart ",itemId)
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    )
  }

  // Update quantity of an item
  const updateQuantity = (itemId, quantity) => {
    console.log("update quantity;",{itemId,quantity})
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove item
      removeFromCart(itemId)
    } else {
      // Update quantity
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity }
            : item
        )
      )
    }
  }

  // Clear entire cart
  const clearCart = () => {
    console.log("clear cart")
    setCartItems([])

    if (tableNumber) {
      const tableCarts = getStoredTableCarts()
      delete tableCarts[tableNumber]
      saveStoredTableCarts(tableCarts)
    } else {
      localStorage.removeItem(LEGACY_CART_KEY)
    }
  }

  // Update table number
  const updateTableNumber = (number) => {
    const normalizedNumber = String(number).trim()

    setTableNumber(normalizedNumber)

    if (normalizedNumber) {
      localStorage.setItem(STORAGE_TABLE_KEY, normalizedNumber)
    } else {
      localStorage.removeItem(STORAGE_TABLE_KEY)
    }
  }

  // Value to provide to all components
  const value = {
    cartItems,
    tableNumber,
    totalPrice,
    totalQuantity,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateTableNumber
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}