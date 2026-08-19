'use strict';

const ApiError = require('../utils/ApiError');
const { parseCalendarDate, monthRange } = require('../utils/dates');
const { escapeRegex } = require('../utils/regex');

/**
 * Translates validated query params into a Mongo filter, always scoped to the
 * owner. Every value has already been through Zod, so no raw user object ever
 * reaches the query - that is what keeps operator injection (`{"$gt": ""}`)
 * impossible.
 *
 * `userId` is a required first argument rather than an optional field on
 * `query`, so it is impossible to build an unscoped filter by accident.
 */
const buildFilter = (userId, query = {}) => {
  const filter = { user: userId };

  if (query.category) filter.category = query.category;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const dateFilter = {};
  if (query.month) {
    const { start, end } = monthRange(query.month);
    dateFilter.$gte = start;
    dateFilter.$lt = end;
  }
  if (query.from) dateFilter.$gte = parseCalendarDate(query.from);
  if (query.to) {
    const to = parseCalendarDate(query.to);
    to.setUTCHours(23, 59, 59, 999);
    dateFilter.$lte = to;
  }
  if (Object.keys(dateFilter).length) filter.date = dateFilter;

  const amountFilter = {};
  if (query.minAmount !== undefined) amountFilter.$gte = query.minAmount;
  if (query.maxAmount !== undefined) amountFilter.$lte = query.maxAmount;
  if (Object.keys(amountFilter).length) filter.amount = amountFilter;

  return filter;
};

const buildSort = ({ sortBy = 'date', sortDir = 'desc' }) => {
  const direction = sortDir === 'asc' ? 1 : -1;
  // `_id` is a stable tie-breaker so pagination cannot repeat or skip rows.
  return { [sortBy]: direction, _id: -1 };
};

/**
 * Generic CRUD for a transaction-shaped model. Expense and income controllers
 * both delegate here instead of duplicating the same six handlers.
 *
 * Reads and writes are matched on `{ _id, user }` together. A request for
 * someone else's document therefore returns "not found" rather than a 403,
 * which avoids confirming that the id exists at all.
 */
const createTransactionService = (Model, label) => ({
  buildFilter,

  async list(userId, query) {
    const filter = buildFilter(userId, query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total, totals] = await Promise.all([
      Model.find(filter).sort(buildSort(query)).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
      Model.aggregate([{ $match: filter }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        filteredTotalAmount: totals[0]?.sum ?? 0,
      },
    };
  },

  async findAll(userId, query) {
    return Model.find(buildFilter(userId, query)).sort(buildSort(query)).lean();
  },

  async getById(userId, id) {
    const doc = await Model.findOne({ _id: id, user: userId }).lean();
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },

  async create(userId, payload) {
    return Model.create({
      ...payload,
      user: userId,
      date: parseCalendarDate(payload.date),
    });
  },

  async update(userId, id, payload) {
    const doc = await Model.findOneAndUpdate(
      { _id: id, user: userId },
      // `user` is not spread from the payload, so a client cannot reassign
      // ownership of a record by sending a different id.
      { ...payload, date: parseCalendarDate(payload.date) },
      { new: true, runValidators: true }
    );
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },

  async remove(userId, id) {
    const doc = await Model.findOneAndDelete({ _id: id, user: userId });
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },
});

module.exports = { createTransactionService, buildFilter, buildSort };
