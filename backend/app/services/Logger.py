import asyncio
from typing import Set
from fastapi import WebSocket
from datetime import datetime


class LogBroker:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.clients.add(ws)

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast(self, message: str):
        async with self.lock:
            clients = list(self.clients)

        for ws in clients:
            try:
                await ws.send_text(message)
            except Exception:
                await self.disconnect(ws)


broker = LogBroker()

async def log(msg: str):
    formatted = f"[{datetime.now().isoformat(timespec='seconds')}] {msg}"
    await broker.broadcast(formatted)