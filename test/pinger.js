// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');

const { EMPTY_BURN_DATA } = require('../interfacedata.js');
const { Pinger } = require('../pinger.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('Pinger', () => {
  describe('pingRecords', () => {
    it('Verifies that a valid URL can ping MDN', () => {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.bcd = true;
      record.key = "Event";
      record.mdn_url = 'https://developer.mozilla.org/docs/Web/API/Event'
      record.type = "reference"
      let records = [];
      records.push(record);
      const pinger = new Pinger(records);
      return pinger.pingRecords(false)
      .then(records => {
        assert.ok(records[0].mdn_exists);
      });
    });

    it('Returns false when the record\'s page does not exist', () => {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.bcd = true;
      record.key = "Event";
      record.mdn_url = 'https://developer.mozilla.org/docs/Web/API/TransitionEvent/wonderful'
      record.type = "property"
      let records = [];
      records.push(record);
      const pinger = new Pinger(records);
      return pinger.pingRecords(false)
      .then(records => {
        assert.strictEqual(records[0].mdn_exists, false);
      })
    })
  });
});