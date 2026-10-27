"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const { sendDailyDigest } = require('../admin/dailyDigest');
function fixture({ reviewed = [], delivered = [], fail = false } = {}) {
  const members = [
    { id: 'old', first_name: 'Old', last_name: 'Member', created_at: '2026-10-20T10:00:00Z', status: 'pending' },
    { id: 'reviewed', first_name: 'Reviewed', last_name: 'Member', created_at: '2026-10-26T10:00:00Z', status: 'pending' },
    { id: 'new', first_name: 'New', last_name: 'Member', created_at: '2026-10-27T10:00:00Z', status: 'pending' }
  ];
  const sent = new Set(delivered);
  const reviewedSet = new Set(reviewed);
  const db = {
    exec() {},
    prepare(sql) {
      if (sql.includes('SELECT cm.id')) return { all: () => members.filter(m => !reviewedSet.has(m.id) && !sent.has(m.id)) };
      if (sql.includes('INSERT OR IGNORE INTO community_admin_digest_deliveries')) return { run: id => sent.add(id) };
      throw new Error('Unexpected query: ' + sql);
    },
    transaction(fn) { return fn; }
  };
  const messages = [];
  const provider = { async send(message) { messages.push(message); return { sent: !fail }; } };
  const config = { admin: { digestRecipient: 'admin@example.org' }, email: { fromAddress: 'sender@example.org' }, publicBaseUrl: 'https://example.org' };
  return { db, provider, config, sent, messages };
}
test('older unsent members are reported; reviewed members are not; no duplicate email', async () => {
  const f = fixture({ reviewed: ['reviewed'] });
  const first = await sendDailyDigest(f);
  assert.equal(first.status, 'sent');
  assert.equal(first.count, 2);
  assert.match(f.messages[0].text, /Old Member/);
  assert.match(f.messages[0].text, /New Member/);
  assert.doesNotMatch(f.messages[0].text, /Reviewed Member/);
  assert.equal((await sendDailyDigest(f)).status, 'empty');
  assert.equal(f.messages.length, 1);
});
test('a failed provider send does not mark any registration sent', async () => {
  const f = fixture({ reviewed: ['reviewed'], fail: true });
  await assert.rejects(() => sendDailyDigest(f), /did not confirm/);
  assert.equal(f.sent.size, 0);
});
test('previously sent registrations are not included', async () => {
  const f = fixture({ reviewed: ['reviewed'], delivered: ['old'] });
  const result = await sendDailyDigest(f);
  assert.equal(result.count, 1);
  assert.doesNotMatch(f.messages[0].text, /Old Member/);
});
