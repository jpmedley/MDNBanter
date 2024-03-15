// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');

const { Popularities } = require('../popularities.js');

describe('Popularities', () => {
  describe('getRating()', () => {
    it('Verifies that a number is returned', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      const rating = pops.getRating('/Element/getAttribute');
      assert.ok(typeof rating === 'number');
    });
    it('Verifies 0 is returned if no value is found', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      const rating = pops.getRating('/Element/getJoe');
      assert.strictEqual(rating, 0);
    });
  });

  describe('source', () => {
    it('Verifies download and parse of popularities data', () => {
      const pops = new Popularities();
      assert.ok(pops.rawData.length > 0);
    });
    it('Verifies filtering of data during parse', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      const items = pops.rawData;
      const remains = items.filter(f => {
        return (!f.includes('/API'));
      });
      assert.ok(remains.length === 0);
    });
    it('Verifies the reading of popularities.json from a specified path', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      assert.ok(pops.rawData.length > 0);
    });
  });
});
