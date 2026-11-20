from __future__ import annotations
import asyncio
import logging
from typing import Any, Callable, Coroutine

class SingleFlight:
    def __init__(self):
        self._tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()
        self._logger = logging.getLogger("API")

    async def execute(self, key: str, fn: Callable[..., Coroutine[Any, Any, Any]], *args, **kwargs) -> Any:
        reused = False
        async with self._lock:
            if key in self._tasks and not self._tasks[key].done():
                task = self._tasks[key]
                reused = True
            else:
                task = asyncio.create_task(fn(*args, **kwargs))
                self._tasks[key] = task
        if reused:
            self._logger.info(f"coalescing concurrent tap for '{key}'")
        try:
            return await task
        finally:
            async with self._lock:
                if self._tasks.get(key) is task:
                    self._tasks.pop(key, None)

portal_flight = SingleFlight()
academia_flight = SingleFlight()
