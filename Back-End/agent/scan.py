import socketio
import time
from smartcard.System import readers
from smartcard.util import toHexString

# =========================
# SERVER CONFIG
# =========================
SERVER_URL = "https://bipsiiutapcareborrowingserver.onrender.com"

# =========================
# SOCKET.IO CLIENT (PROD READY)
# =========================
sio = socketio.Client(
    reconnection=True,
    reconnection_attempts=999,
    reconnection_delay=2,
    logger=True,
    engineio_logger=True
)

# =========================
# SOCKET EVENTS
# =========================
@sio.event
def connect():
    print(f"✅ Connected to Server: {SERVER_URL}")

@sio.event
def disconnect():
    print("❌ Disconnected from Server")

@sio.event
def connect_error(data):
    print("❌ Connection Error:", data)

# =========================
# RFID LOOP
# =========================
def start_rfid():
    try:
        # FORCE websocket (IMPORTANT FOR RENDER)
        sio.connect(SERVER_URL, transports=["websocket"])
        print("🔌 Socket connection initiated...")

        r = readers()

        if len(r) == 0:
            print("❌ No RFID reader found.")
            return

        reader = r[0]
        last_id = None

        print("📡 Ready to scan RFID cards...")

        while True:
            try:
                connection = reader.createConnection()
                connection.connect()

                # READ RFID UID
                data, _, _ = connection.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
                card_id = toHexString(data).replace(" ", "")

                if card_id and card_id != last_id:
                    print(f"🎯 RFID Detected: {card_id}")

                    # EMIT TO SERVER
                    sio.emit("rfid-scanned", {
                        "uid": card_id,
                        "source": "Remote-Python"
                    })

                    print("📤 Emitted successfully")
                    last_id = card_id

            except Exception as e:
                print(f"⚠️ RFID Read Error: {e}")
                last_id = None

            time.sleep(0.5)

    except Exception as e:
        print("❌ Socket Connection Failed:", e)

# =========================
# RUN PROGRAM
# =========================
if __name__ == "__main__":
    start_rfid()