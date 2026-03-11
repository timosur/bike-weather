"""In-memory job store for async scrape/extract pipelines."""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class JobStatus(str, Enum):
    PENDING = "pending"
    SCRAPING = "scraping"
    EXTRACTING = "extracting"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ProgressEvent:
    stage: str
    message: str
    data: dict[str, Any] | None = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class Job:
    id: str
    shop: str
    category: str
    max_products: int
    status: JobStatus = JobStatus.PENDING
    progress: list[ProgressEvent] = field(default_factory=list)
    products: list[dict[str, Any]] | None = None
    error: str | None = None
    created_at: float = field(default_factory=time.time)
    _subscribers: list[asyncio.Queue[ProgressEvent | None]] = field(
        default_factory=list, repr=False
    )

    def add_progress(
        self, stage: str, message: str, data: dict[str, Any] | None = None
    ) -> None:
        event = ProgressEvent(stage=stage, message=message, data=data)
        self.progress.append(event)
        for queue in self._subscribers:
            queue.put_nowait(event)

    def subscribe(self) -> asyncio.Queue[ProgressEvent | None]:
        queue: asyncio.Queue[ProgressEvent | None] = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[ProgressEvent | None]) -> None:
        self._subscribers = [q for q in self._subscribers if q is not queue]

    def notify_done(self) -> None:
        for queue in self._subscribers:
            queue.put_nowait(None)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "jobId": self.id,
            "shop": self.shop,
            "category": self.category,
            "maxProducts": self.max_products,
            "status": self.status.value,
            "progress": [
                {
                    "stage": e.stage,
                    "message": e.message,
                    "data": e.data,
                    "timestamp": e.timestamp,
                }
                for e in self.progress
            ],
            "error": self.error,
            "createdAt": self.created_at,
        }
        if self.products is not None:
            result["products"] = self.products
        return result


JOB_TTL_SECONDS = 3600  # 1 hour


class JobManager:
    """Thread-safe in-memory job store."""

    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, shop: str, category: str, max_products: int) -> Job:
        job_id = str(uuid.uuid4())
        job = Job(id=job_id, shop=shop, category=category, max_products=max_products)
        async with self._lock:
            self._jobs[job_id] = job
        return job

    async def get_job(self, job_id: str) -> Job | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def cleanup_old_jobs(self) -> int:
        now = time.time()
        removed = 0
        async with self._lock:
            expired = [
                jid
                for jid, job in self._jobs.items()
                if now - job.created_at > JOB_TTL_SECONDS
                and job.status in (JobStatus.COMPLETED, JobStatus.FAILED)
            ]
            for jid in expired:
                del self._jobs[jid]
                removed += 1
        return removed


job_manager = JobManager()
