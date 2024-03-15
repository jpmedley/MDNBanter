// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const COMMENTS = './test/files/comments.idl';
const COMMENTS_CLEANED = './test/files/comments-cleaned.idl';

const assert = require('assert');
const fs = require('fs');

const utils = require('../utils.js');

describe('Utils', () => {
  describe('getAlternateKey()', () => {
    it('Verifies that alternate keys are returned', () => {
      const key = 'WebGLColorBufferFloat';
      const altKey = 'WEBGL_color_buffer_float';
      let retrievedKey = utils.getAlternateKey(key);
      assert.strictEqual(altKey, retrievedKey);
    });
  });

  describe('getIDLFile()', () => {
    it('Verifies that all possible comments and whitespace are removed', () => {
      let buffer = fs.readFileSync(COMMENTS_CLEANED);
      const comparisonFile = buffer.toString();
      const options = { "clean": true }
      const cleanedFile = utils.getIDLFile(COMMENTS, options);
      assert.strictEqual(cleanedFile, comparisonFile);
    });
  });
});