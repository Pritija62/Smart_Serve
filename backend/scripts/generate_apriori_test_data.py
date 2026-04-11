"""
Generate 100 realistic test orders to demonstrate the Apriori algorithm.
Run from the backend directory:
    python scripts/generate_apriori_test_data.py
The script uses the existing application context, so DATABASE_URL must be set.
"""
import sys
import os
import random
from datetime import datetime, timedelta
# Make sure the backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app, db
from app.models import MenuItem, Order, OrderItem
# ---------------------------------------------------------------------------
# Order combinations (item names must match those in the menu).
# Each entry is (combo, weight) where weight controls how often it appears.
# ---------------------------------------------------------------------------
COMBOS = [
    (['Burger', 'French Fries', 'Coca Cola'], 15),
    (['Steak', 'Smoothie'], 8),
    (['Grilled Chicken', 'French Fries', 'Coca Cola'], 12),
    (['Burger', 'French Fries', 'Coca Cola'], 10),   # extra weight for Burger combo
    (['Samosa', 'Fresh Juice'], 10),
    (['Spring Rolls', 'Coca Cola'], 8),
    (['Paneer Tikka', 'Fresh Juice'], 9),
    (['Fish Grilled', 'French Fries', 'Smoothie'], 8),
    (['French Fries', 'Coca Cola'], 12),
    (['Chicken Fries', 'Smoothie'], 8),
]
def random_timestamp(days=30):
    """Return a random UTC datetime within the last *days* days."""
    now = datetime.utcnow()
    delta = timedelta(
        days=random.randint(0, days - 1),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )
    return now - delta
def main():
    app, db_instance, _ = create_app()
    with app.app_context():
        # Build a name → MenuItem map for fast lookup
        menu_by_name = {item.name: item for item in MenuItem.query.all()}
        if not menu_by_name:
            print("❌  No menu items found. Run sampledata.py first.")
            sys.exit(1)
        # Expand combos into a weighted list
        weighted_combos = []
        for combo_items, weight in COMBOS:
            weighted_combos.extend([combo_items] * weight)
        created = 0
        skipped = 0
        for _ in range(100):
            item_names = random.choice(weighted_combos)
            # Resolve names; skip items that don't exist in the menu
            menu_items = [menu_by_name[name] for name in item_names if name in menu_by_name]
            if not menu_items:
                skipped += 1
                continue
            order = Order(
                table_number=str(random.randint(1, 20)),
                status='completed',
                created_at=random_timestamp(30),
            )
            db_instance.session.add(order)
            db_instance.session.flush()  # assign order.id before adding items
            total = 0.0
            for menu_item in menu_items:
                quantity = random.randint(1, 2)
                order_item = OrderItem(
                    order_id=order.id,
                    menu_item_id=menu_item.id,
                    quantity=quantity,
                )
                db_instance.session.add(order_item)
                total += menu_item.price * quantity
            order.total_price = total
            created += 1
        db_instance.session.commit()
        print(f"✅  Created {created} test orders ({skipped} skipped due to missing menu items).")
        print(f"   Total orders in DB: {Order.query.count()}")
if __name__ == '__main__':
    main()
