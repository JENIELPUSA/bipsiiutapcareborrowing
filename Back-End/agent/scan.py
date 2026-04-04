import socketio
import time
from smartcard.System import readers
from smartcard.util import toHexString

# Set the URL of your server
SERVER_URL = "http://localhost:3000"

# Initialize Socket.IO client
sio = socketio.Client()

# Event when connected to the server
@sio.event
def connect():
    print(f"Connected to Server at {SERVER_URL}")

# Event when disconnected from the server
@sio.event
def disconnect():
    print("Disconnected from Server")

# Function to start the RFID scanning
def start_rfid():
    try:
        sio.connect(SERVER_URL)  # Connect to the server
        r = readers()  # Get all available readers

        if len(r) == 0:
            print("No reader found.")
            return

        reader = r[0]  # Select the first reader
        last_id = None  # Keep track of the last scanned ID
        print("Ready to scan...")

        while True:
            try:
                connection = reader.createConnection()
                connection.connect()

                # Transmit the APDU command to read the card
                data, _, _ = connection.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
                card_id = toHexString(data).replace(" ", "")  # Convert data to string format

                if card_id != last_id:  # Check if it's a new scan
                    print(f"Scanned: {card_id}")
                    # Emit the scanned card ID to the server via Socket.IO
                    sio.emit("rfid-scanned", {"uid": card_id, "source": "Remote-Python"})
                    last_id = card_id  # Update the last scanned ID
            except Exception as e:
                print(f"Error while reading card: {e}")
                last_id = None  # Reset the last_id in case of error
            time.sleep(0.5)  # Delay between scans to avoid high CPU usage

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    start_rfid()
