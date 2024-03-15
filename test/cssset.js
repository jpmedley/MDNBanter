// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');

const { CSSSet } = require('../cssset.js');

describe('CSSSet', () => {
  describe('constructor', () => {
    it('Confirms that CSS data is loaded', () => {
      const cd = new CSSSet();
      assert.strictEqual((typeof cd.properties.parameters), 'object');
    });

    it('Confirms that deep CSS data is accessible', () => {
      const cd = new CSSSet();
      assert.strictEqual(cd.properties.data[0].name, "animation-delay");
    });
  });

  describe('findMatching', () => {
    it('Confirms something', () => {

    });
  });
});