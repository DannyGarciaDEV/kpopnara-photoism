import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';

const SESSION_MINUTES = 10;

async function remainingActiveSessionMinutes(queueEntryId: string): Promise<number> {
  const session = await Session.findOne({ queue_entry_id: queueEntryId, status: 'active' });
  if (!session?.end_time) return SESSION_MINUTES;
  const secs = Math.max(0, Math.floor((new Date(session.end_time).getTime() - Date.now()) / 1000));
  return Math.max(1, Math.ceil(secs / 60));
}

/** Minutes contributed by one queue entry toward people behind them. */
async function minutesForEntryAhead(entry: { _id: { toString: () => string }; status: string }): Promise<number> {
  if (entry.status === 'active') {
    return remainingActiveSessionMinutes(entry._id.toString());
  }
  return SESSION_MINUTES;
}

/**
 * Estimated wait for someone joining at the end of the queue (everyone currently in line is ahead).
 */
export async function estimateWaitForNewJoin(locationId: string): Promise<number> {
  const activeEntries = await QueueEntry.find({
    location_id: locationId,
    status: { $in: ['waiting', 'notified', 'active'] },
  }).sort({ position: 1 });

  let total = 0;
  for (const e of activeEntries) {
    total += await minutesForEntryAhead(e);
  }
  return total;
}

/**
 * Estimated wait for an existing queue entry (sum of time for everyone ahead of them in line).
 */
export async function estimateWaitForEntry(locationId: string, entryId: string): Promise<number> {
  const activeEntries = await QueueEntry.find({
    location_id: locationId,
    status: { $in: ['waiting', 'notified', 'active'] },
  }).sort({ position: 1 });

  const myIdx = activeEntries.findIndex((e) => e._id.toString() === entryId);
  if (myIdx <= 0) return 0;

  let total = 0;
  for (let i = 0; i < myIdx; i++) {
    total += await minutesForEntryAhead(activeEntries[i]);
  }
  return total;
}
