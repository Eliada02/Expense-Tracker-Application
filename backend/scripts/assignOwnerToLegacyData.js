'use strict';

/**
 * One-off migration for databases created before authentication existed.
 *
 * Records written back then have no `user` field, which makes them invisible
 * (and un-editable) now that every query is scoped to an owner. This adopts
 * them into a single account so an existing install keeps working.
 *
 * Usage:
 *   node scripts/assignOwnerToLegacyData.js --email demo@example.com --password secret123 --name Demo
 *   node scripts/assignOwnerToLegacyData.js --email me@example.com --dry-run
 *
 * Safe to run more than once: it only touches documents that still have no
 * owner, and it never deletes anything.
 */

const mongoose = require('mongoose');
const { connectDb, disconnectDb } = require('../config/db');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const Recurring = require('../models/Recurring');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
  };
  return {
    email: get('--email'),
    password: get('--password'),
    name: get('--name') || 'Demo User',
    dryRun: args.includes('--dry-run'),
  };
};

const MODELS = [
  ['expenses', Expense],
  ['incomes', Income],
  ['budgets', Budget],
  ['recurring rules', Recurring],
];

/** Matches documents from before the `user` field existed. */
const ORPHANED = { $or: [{ user: { $exists: false } }, { user: null }] };

const run = async () => {
  const { email, password, name, dryRun } = parseArgs();

  if (!email) {
    console.error('Missing --email. See the usage comment at the top of this file.');
    process.exit(1);
  }

  await connectDb();

  const counts = {};
  let total = 0;
  for (const [label, Model] of MODELS) {
    counts[label] = await Model.countDocuments(ORPHANED);
    total += counts[label];
  }

  console.log('\nUnowned documents found:');
  for (const [label] of MODELS) console.log(`  ${label.padEnd(16)} ${counts[label]}`);

  if (total === 0) {
    console.log('\nNothing to migrate - every document already has an owner.');
    await disconnectDb();
    return;
  }

  if (dryRun) {
    console.log(`\n--dry-run: would assign ${total} documents to ${email}. No changes made.`);
    await disconnectDb();
    return;
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    console.log(`\nUsing existing account: ${user.email}`);
  } else {
    if (!password) {
      console.error('\nThat account does not exist yet, so --password is required to create it.');
      await disconnectDb();
      process.exit(1);
    }
    user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await User.hashPassword(password),
    });
    console.log(`\nCreated account: ${user.email}`);
  }

  console.log('\nAssigning ownership:');
  for (const [label, Model] of MODELS) {
    if (counts[label] === 0) continue;
    const result = await Model.updateMany(ORPHANED, { $set: { user: user._id } });
    console.log(`  ${label.padEnd(16)} ${result.modifiedCount} updated`);
  }

  // The old unique index on `category` alone would stop a second user from
  // ever creating a budget for the same category, so it has to go.
  try {
    const indexes = await Budget.collection.indexes();
    const legacy = indexes.find(
      (i) => i.unique && i.key.category === 1 && i.key.user === undefined
    );
    if (legacy) {
      await Budget.collection.dropIndex(legacy.name);
      console.log(`\nDropped legacy budget index "${legacy.name}"`);
    }
  } catch (error) {
    console.warn('\nCould not inspect budget indexes:', error.message);
  }
  await Budget.syncIndexes();

  console.log(`\nDone. ${total} documents now belong to ${user.email}.`);
  await disconnectDb();
};

run().catch(async (error) => {
  console.error('Migration failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
