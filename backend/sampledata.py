from app import create_app, db
from app.models import User, MenuItem, Order, OrderItem

# Create app context
app, db, socketio = create_app()

with app.app_context():
    # Clear existing data 
    print(" Clearing existing data...")
    db.session.query(OrderItem).delete()
    db.session.query(Order).delete()
    db.session.query(MenuItem).delete()
    db.session.query(User).delete()
    db.session.commit()
    
    # CREATE USERS 
    print(" Creating users...")
    
    # Kitchen Staff User
    kitchen_staff = User(
        username='john_chef',
        email='john@restaurant.com',
        role='kitchen_staff'
    )
    kitchen_staff.set_password('password123')
    db.session.add(kitchen_staff)
    
    # Admin User
    admin = User(
        username='admin_user',
        email='admin@restaurant.com',
        role='admin'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    
    db.session.commit()
    print(" Users created:")
    print("   Kitchen Staff: john@restaurant.com / password123")
    print("   Admin: admin@restaurant.com / admin123")
    
    # CREATE MENU ITEMS 
    print("\n  Creating menu items...")
    
    menu_items = [
        # Grill Station (5 items)
        MenuItem(
            name='Burger',
            description='Cheese burger with lettuce and tomato',
            price=150.0,
            prep_time=300,  # 5 minutes
            station='grill'
        ),
        MenuItem(
            name='Grilled Chicken',
            description='Tender grilled chicken breast',
            price=180.0,
            prep_time=240,  # 4 minutes
            station='grill'
        ),
        MenuItem(
            name='Steak',
            description='Premium beef steak',
            price=350.0,
            prep_time=360,  # 6 minutes
            station='grill'
        ),
        MenuItem(
            name='Fish Grilled',
            description='Fresh grilled fish',
            price=200.0,
            prep_time=240,  # 4 minutes
            station='grill'
        ),
        MenuItem(
            name='Paneer Tikka',
            description='Grilled paneer with spices',
            price=120.0,
            prep_time=180,  # 3 minutes
            station='grill'
        ),
        
        # Fry Station (4 items)
        MenuItem(
            name='French Fries',
            description='Crispy golden fries',
            price=50.0,
            prep_time=120,  # 2 minutes
            station='fry'
        ),
        MenuItem(
            name='Chicken Fries',
            description='Crispy chicken fries',
            price=80.0,
            prep_time=150,  # 2.5 minutes
            station='fry'
        ),
        MenuItem(
            name='Spring Rolls',
            description='Crispy spring rolls with sauce',
            price=60.0,
            prep_time=180,  # 3 minutes
            station='fry'
        ),
        MenuItem(
            name='Samosa',
            description='Crispy samosa with chutney',
            price=40.0,
            prep_time=120,  # 2 minutes
            station='fry'
        ),
        
        # Drinks Station (4 items)
        MenuItem(
            name='Coca Cola',
            description='Cold coca cola',
            price=30.0,
            prep_time=30,  # 30 seconds
            station='drinks'
        ),
        MenuItem(
            name='Fresh Juice',
            description='Fresh orange juice',
            price=80.0,
            prep_time=120,  # 2 minutes
            station='drinks'
        ),
        MenuItem(
            name='Iced Coffee',
            description='Cold iced coffee',
            price=100.0,
            prep_time=180,  # 3 minutes
            station='drinks'
        ),
        MenuItem(
            name='Smoothie',
            description='Mixed fruit smoothie',
            price=90.0,
            prep_time=150,  # 2.5 minutes
            station='drinks'
        ),
        
        # Salads Station (2 items)
        MenuItem(
            name='Caesar Salad',
            description='Fresh caesar salad with chicken',
            price=130.0,
            prep_time=120,  # 2 minutes
            station='salads'
        ),
        MenuItem(
            name='Vegetable Salad',
            description='Fresh mixed vegetable salad',
            price=80.0,
            prep_time=120,  # 2 minutes
            station='salads'
        ),
    ]
    
    for item in menu_items:
        db.session.add(item)
    
    db.session.commit()
    print(f" {len(menu_items)} menu items created")
    
    # DISPLAY SUMMARY
    print("\n DATABASE SUMMARY:")
    print(f"   Total Users: {User.query.count()}")
    print(f"   Total Menu Items: {MenuItem.query.count()}")
    print(f"   Total Orders: {Order.query.count()}")
    
    print("\nSample data created successfully!")
