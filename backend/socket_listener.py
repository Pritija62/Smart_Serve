import socketio

sio = socketio.Client(logger=False, engineio_logger=False)

@sio.event
def connect():
    print("✅ Connected to Socket.IO server")

@sio.event
def disconnect():
    print("❌ Disconnected")

@sio.on("new_order")
def on_new_order(data):
    print("\n🔔 new_order event received:")
    print(data)

@sio.on("order_status_updated")
def on_order_status_updated(data):
    print("\n✏️ order_status_updated event received:")
    print(data)

print("Connecting to http://localhost:5000 ...")
sio.connect("http://localhost:5000")
print("Listening... (Press Ctrl+C to quit)")
sio.wait()