import React, { useState } from 'react'
import { useContext } from 'react'
import { OrderContext } from '../context/orderContext'

export default function MenuPage() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, totalPrice, totalQuantity } = useContext(OrderContext)
  const [tableNumber, setTableNumber] = useState('')

  // Sample menu items
  const menuItems = [
    { id: 1, name: 'Burger', price: 150 },
    { id: 2, name: 'Fries', price: 50 },
    { id: 3, name: 'Pizza', price: 200 },
    { id: 4, name: 'Coke', price: 30 }
  ]

  const handleAddToCart = (item) => {
    console.log('Adding item:', item)
    addToCart(item)
  }

  return (
    <div>
      <h1>Test Menu Page</h1>

      <div>
        <h2>Menu Items</h2>
        {menuItems.map(item => (
          <div key={item.id} style={{ border: '1px solid black', padding: '10px', margin: '5px' }}>
            <p>{item.name} - Rs {item.price}</p>
            <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <hr />

      <div>
        <h2>Cart Items ({totalQuantity})</h2>
        {cartItems.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          cartItems.map(item => (
            <div key={item.id} style={{ border: '1px solid blue', padding: '10px', margin: '5px' }}>
              <p>{item.name} × {item.quantity} = Rs {item.price * item.quantity}</p>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                Increase
              </button>
              <button onClick={() => removeFromCart(item.id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div>
        <h2>Cart Summary</h2>
        <p>Total Items: {totalQuantity}</p>
        <p>Total Price: Rs {totalPrice}</p>
      </div>

      <hr />
      <p><a href="/login">Go to Test Login</a></p>
      <p><a href="/">Back to Home</a></p>
    </div>
  )
}