// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');

const { bcd } = require('../bcd.js')
global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('BCD', () => {
  describe('getByKey()', () => {
    it('Confirms that null is returned for a fictitious key', () => {
      assert.strictEqual(bcd.getByKey('Medley'), null);
    });

    it('Confirms that a tree is returned for a real value', () => {
      assert.notStrictEqual(bcd.getByKey('Request'), null);
    });
  });

  describe('getBrowsers()', () => {
    it('Confirms that the key \'Event\' returns 14 browsers', () => {
      const browsers = bcd.getBrowsers('Event');
      assert.strictEqual(browsers.length, 15);
    });
    it('Confirms that the key \'Burnable\' returns null', () => {
      const browsers = bcd.getBrowsers('Burnable');
      assert.strictEqual(browsers, null);
    })
  });

  describe('getEngines()', () => {
    it('Confirms that the key \'Event\' returns three engines', () => {
      const engines = bcd.getEngines('Event');
      assert.strictEqual(engines.length, 3);
    });
    it('Confirms that the key \'Burnable\' returns null', () => {
      const engines = bcd.getEngines('Burnable');
      assert.strictEqual(engines, null);
    })
  });

  describe('getRecordByKey()', () => {
    it('Confirms that a constructed URL is returned when one is missing from BCD', () => {
      let found = bcd.getRecordByKey('Medley');
      assert.strictEqual(found.mdn_url, 'https://developer.mozilla.org/en-US/docs/Web/API/Medley');
    });
    it('Confirms that a multipart key is correctly converted to a URL', () => {
      let found = bcd.getRecordByKey('Medley.joe');
      assert.strictEqual(found.mdn_url, 'https://developer.mozilla.org/en-US/docs/Web/API/Medley/joe');
    });
  });

  describe('getVersions()', () => {
    it('Confirms that a support triplet is returned in the form of an 3 element array', () => {
      const browsers = ['chrome', 'chrome_android', 'webview_android'];
      const engines = bcd.getVersions('Event', browsers);
      assert.strictEqual(engines.length, 3);
    });
  });

});