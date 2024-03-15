// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');
const utils = require('../utils.js');

const { DictionaryData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const DICTIONARY = './test/files/dictionary.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('DictionaryData', () => {
  describe('Properties', () => {
    it('Confirms that the name property returns the correct value', () => {
      const dicrtionarySource = loadSource(DICTIONARY);
      const ds = new DictionaryData(dicrtionarySource, DICTIONARY);
      assert.strictEqual(ds.name, 'USBDeviceFilter');
    });
  });
});