const pool = require('../config/db');

async function logEvent(dealId, eventType, actorId, description, metadata = null, conn = pool) {
  const eventId = `EVT-${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await conn.query(
    'INSERT INTO deal_events (id, deal_id, event_type, actor_id, description, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    [eventId, dealId, eventType, actorId, description, metadata ? JSON.stringify(metadata) : null]
  );
}

module.exports = logEvent;