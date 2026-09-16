/**
 * Zero-install local Postgres for development and tests.
 * ---------------------------------------------------------------------------
 * Runs PGlite (PostgreSQL compiled to WASM) and exposes it over the real
 * Postgres wire protocol on a TCP port, so Prisma — and anything else that
 * speaks Postgres — connects to it with an ordinary DATABASE_URL.
 *
 * This exists so the backend can be run and tested on a machine with no
 * PostgreSQL install and no Docker. It is NOT for production: PGlite is
 * single-connection and single-process. For production (or any shared
 * environment) point DATABASE_URL at a real PostgreSQL server instead —
 * nothing else in the codebase changes.
 *
 *   node scripts/dev-db.mjs [port] [dataDir]
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.argv[2]) || 5432;
const dataDir = process.argv[3] || "./.pglite-data";

/**
 * Wire-protocol fix-up between the socket bridge and PGlite.
 *
 * When a statement fails (unique violation, CHECK constraint, …) PGlite
 * answers an extended-protocol pipeline with ErrorResponse followed by TWO
 * ReadyForQuery messages; a real PostgreSQL server sends one. Prisma's engine
 * reads the extra one as "unexpected message from server" and the connection
 * is lost for every query after it. Messages are therefore handed to PGlite a
 * whole pipeline at a time (up to Sync/Query/…), and a ReadyForQuery that
 * immediately repeats the previous one is dropped. Verified against unique
 * and CHECK violations, failed interactive and batch transactions, and large
 * result sets. None of this applies to a real PostgreSQL server.
 */
const BATCH_END = new Set([0x53, 0x51, 0x58, 0x48, 0x70]); // Sync, Query, Terminate, Flush, PasswordMessage
const READY_FOR_QUERY = 0x5a;
const PROTOCOL_V3 = 196608;
const SSL_REQUEST = 80877103;

function installProtocolShim(pglite) {
  const exec = pglite.execProtocolRawStream.bind(pglite);
  let pending = [];

  pglite.execProtocolRawStream = async (message, options = {}) => {
    const buf = Buffer.from(message);
    const untyped = buf.length >= 8 && [PROTOCOL_V3, SSL_REQUEST].includes(buf.readInt32BE(4)); // startup packets
    if (!untyped && !BATCH_END.has(buf[0])) {
      pending.push(buf);
      return;
    }

    const batch = Buffer.concat([...pending, buf]);
    pending = [];
    const chunks = [];
    await exec(new Uint8Array(batch), { ...options, onRawData: (data) => chunks.push(Buffer.from(data)) });
    const out = Buffer.concat(chunks);

    let cleaned = out;
    if (!untyped) {
      const kept = [];
      let previousType = 0;
      for (let i = 0; i + 5 <= out.length; ) {
        const type = out[i];
        const end = i + 1 + out.readInt32BE(i + 1);
        if (!(type === READY_FOR_QUERY && previousType === READY_FOR_QUERY)) kept.push(out.subarray(i, end));
        previousType = type;
        i = end;
      }
      cleaned = Buffer.concat(kept);
    }
    if (cleaned.length) options.onRawData?.(new Uint8Array(cleaned));
  };
}

const db = await PGlite.create({ dataDir });
installProtocolShim(db);
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });

// A client that vanishes mid-query (a killed dev server, a Ctrl-C'd script)
// otherwise surfaces as an unhandled error that takes this process down —
// leaving the port bound by a dead instance and, worse, the data directory
// half-written. Log and carry on instead.
server.addEventListener?.("error", (event) => {
  console.warn("PGlite socket error (client likely disconnected):", event?.detail ?? event);
});
process.on("uncaughtException", (err) => {
  console.warn("PGlite: ignoring uncaught error:", err?.message ?? err);
});

await server.start();
console.log(`PGlite listening on postgres://postgres:postgres@127.0.0.1:${port}/postgres (data: ${dataDir})`);

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  // Closing the database cleanly is what keeps the data directory usable;
  // a hard kill is what corrupts it.
  try {
    await server.stop();
    await db.close();
  } finally {
    process.exit(0);
  }
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(signal, shutdown);
}
