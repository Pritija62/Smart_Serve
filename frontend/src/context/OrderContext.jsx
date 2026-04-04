import React, { createContext, useState, useEffect } from 'react'

// Create the context
export const OrderContext = createContext()

// Create the provider component
export const OrderProvider = ({ children }) => {
  // State variables
  const [cartItems, setCartItems] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalQuantity, setTotalQuantity] = useState(0)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    const savedTable = localStorage.getItem('tableNumber')

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (err) {
        console.error('Error loading cart:', err)
      }
    }

    if (savedTable) {
      setTableNumber(savedTable)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Save table number to localStorage whenever it changes
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('tableNumber', tableNumber)
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
    setTableNumber('')
    localStorage.removeItem('cart')
    localStorage.removeItem('tableNumber')
  }

  // Update table number
  const updateTableNumber = (number) => {
    setTableNumber(number)
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