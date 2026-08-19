'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const { toCsv } = require('../utils/csv');
const { PAYMENT_METHODS } = require('../constants/taxonomy');

const PAYMENT_LABELS = new Map(PAYMENT_METHODS.map((p) => [p.id, p.label]));

const EXPORT_COLUMNS = [
  { key: 'date', header: 'Date' },
  { key: 'title', header: 'Title' },
  { key: 'category', header: 'Category' },
  { key: 'amount', header: 'Amount' },
  { key: 'paymentMethod', header: 'Payment method' },
  { key: 'description', header: 'Notes' },
];

/**
 * Builds the six REST handlers for a transaction resource. Expenses and incomes
 * share this factory so the CRUD logic exists exactly once.
 *
 * Every handler passes `req.user._id` into the service. That value comes from
 * the verified session cookie, never from the request body or query, so a
 * client cannot ask for another user's rows.
 */
const createTransactionController = (service, label) => ({
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await service.list(req.user._id, req.query);
    res.json({ success: true, data: items, meta });
  }),

  getOne: asyncHandler(async (req, res) => {
    const item = await service.getById(req.user._id, req.params.id);
    res.json({ success: true, data: item });
  }),

  create: asyncHandler(async (req, res) => {
    const created = await service.create(req.user._id, req.body);
    res.status(201).json({ success: true, message: `${label} created`, data: created });
  }),

  update: asyncHandler(async (req, res) => {
    const updated = await service.update(req.user._id, req.params.id, req.body);
    res.json({ success: true, message: `${label} updated`, data: updated });
  }),

  remove: asyncHandler(async (req, res) => {
    await service.remove(req.user._id, req.params.id);
    res.json({ success: true, message: `${label} deleted` });
  }),

  /** Exports every row matching the current filters (not just the page). */
  export: asyncHandler(async (req, res) => {
    const { format, ...filters } = req.query;
    const rows = await service.findAll(req.user._id, filters);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${label.toLowerCase()}s-${stamp}.${format}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(JSON.stringify(rows, null, 2));
    }

    const csv = toCsv(
      EXPORT_COLUMNS,
      rows.map((row) => ({
        ...row,
        date: row.date,
        paymentMethod: PAYMENT_LABELS.get(row.paymentMethod) ?? '',
      }))
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // BOM so Excel opens accented characters correctly.
    return res.send(`﻿${csv}`);
  }),
});

module.exports = { createTransactionController, EXPORT_COLUMNS };
