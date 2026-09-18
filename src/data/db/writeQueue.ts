/**
 * Serialises every write against one database.
 *
 * expo-sqlite runs each exclusive transaction on its own connection, and while
 * one is writing, any other write fails immediately with "database is locked".
 * Sync persists pages as they arrive (several downloads in flight) and the
 * image cache writes while the list scrolls, so writes must never overlap.
 * Network work stays concurrent; only the writes queue.
 */
const tails = new WeakMap<object, Promise<unknown>>();

export function serializeWrite<T>(db: object, task: () => Promise<T>): Promise<T> {
  const previous = tails.get(db) ?? Promise.resolve();
  // Run after the previous write settles, whether it succeeded or failed.
  const run = previous.then(task, task);
  tails.set(
    db,
    run.catch(() => undefined),
  );
  return run;
}
