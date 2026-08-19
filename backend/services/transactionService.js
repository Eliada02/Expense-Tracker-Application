'use strict';

const ApiError = require('../utils/ApiError');
const { parseCalendarDate, monthRange } = require('../utils/dates');
const { escapeRegex } = require('../utils/regex');

/**
 * Translates validated query params into a Mongo filter. Every value has
 * already been through Zod, so no raw user object ever reaches the query –
 * this is what keeps operator-injection (`{"$gt": ""}`) impossible.
 */
const buildFilter = (query = {}) => {
  const filter = {};

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
 */
const createTransactionService = (Model, label) => ({
  buildFilter,

  async list(query) {
    const filter = buildFilter(query);
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

  async findAll(query) {
    return Model.find(buildFilter(query)).sort(buildSort(query)).lean();
  },

  async getById(id) {
    const doc = await Model.findById(id).lean();
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },

  async create(payload) {
    return Model.create({ ...payload, date: parseCalendarDate(payload.date) });
  },

  async update(id, payload) {
    const doc = await Model.findByIdAndUpdate(
      id,
      { ...payload, date: parseCalendarDate(payload.date) },
      { new: true, runValidators: true }
    );
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },

  async remove(id) {
    const doc = await Model.findByIdAndDelete(id);
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },
});

module.exports = { createTransactionService, buildFilter, buildSort };
