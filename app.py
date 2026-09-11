from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*")

# This stores the current active bus numbers
current_buses = []
bus_history = []  # Optional: track what was called and when

# ============================================
# ROUTES (URLs people visit)
# ============================================

@app.route('/')
def home():
    """Landing page - redirect to display or show menu"""
    return '''
        <h1>Bus Calling System</h1>
        <a href="/display">Display View (for TVs)</a><br>
        <a href="/admin">Admin View (for staff)</a>
    '''

@app.route('/display')
def display():
    """The page that classroom TVs will show"""
    return render_template('display.html', buses=current_buses)

@app.route('/admin')
def admin():
    """The page staff use to input bus numbers"""
    return render_template('admin.html')

# ============================================
# WEBSOCKET EVENTS (Real-time communication)
# ============================================

@socketio.on('connect')
def handle_connect():
    """When a display screen connects, send current data"""
    print('Client connected')
    emit('update_buses', {'buses': current_buses})

@socketio.on('submit_buses')
def handle_bus_submission(data):
    """
    When admin submits new bus numbers:
    1. Update the server's stored list
    2. Broadcast to all connected displays
    """
    global current_buses
    
    # Get the bus numbers from the admin
    bus_numbers = data.get('buses', [])
    current_buses = bus_numbers
    
    # Log it (optional)
    timestamp = datetime.now().strftime("%I:%M %p")
    bus_history.append({
        'time': timestamp,
        'buses': bus_numbers.copy()
    })
    print(f"[{timestamp}] Buses updated: {bus_numbers}")
    
    # Push to ALL connected display screens
    emit('update_buses', {'buses': current_buses}, broadcast=True)
    
    # Confirm back to admin
    emit('submission_confirmed', {'status': 'success'})

@socketio.on('clear_buses')
def handle_clear():
    """Clear all buses (end of day or reset)"""
    global current_buses
    current_buses = []
    emit('update_buses', {'buses': []}, broadcast=True)
    print("Buses cleared")

# ============================================
# RUN THE SERVER
# ============================================

if __name__ == '__main__':
    print("🚌 Bus System Server Starting...")
    print("📱 Admin page: http://localhost:5000/admin")
    print("📺 Display page: http://localhost:5000/display")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
