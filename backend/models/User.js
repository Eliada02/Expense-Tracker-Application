'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Cost factor for bcrypt. 12 is the current sensible default: slow enough to
 * make offline cracking expensive, fast enough for an interactive login.
 */
const BCRYPT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, 'Email is too long'],
    },
    /**
     * Only ever holds a bcrypt hash. `select: false` keeps it out of every
     * query result unless a caller explicitly asks for it, so it cannot leak
     * through a controller that forgets to strip it.
     */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        // Belt and braces: even if something selects the hash, it never
        // reaches a JSON response.
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

/** Hashes a plaintext password. The plaintext is never stored or logged. */
UserSchema.statics.hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

/**
 * Constant-time comparison via bcrypt. Returns false rather than throwing when
 * the document was loaded without the hash.
 */
UserSchema.methods.verifyPassword = function verifyPassword(password) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

/** The shape sent to the client. Never includes the hash. */
UserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
module.exports.BCRYPT_ROUNDS = BCRYPT_ROUNDS;
