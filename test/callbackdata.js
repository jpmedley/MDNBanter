// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');
const utils = require('../utils.js');

const { CallbackData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const CALLBACK = './test/files/callback.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('CallbackData', () => {
  describe('Properties', () => {
    it('Confirms that the name property returns the correct value', () => {
      const callbackSource = loadSource(CALLBACK);
      const cs = new CallbackData(callbackSource, CALLBACK);
      assert.strictEqual(cs.name, 'DecodeErrorCallback');
    });
  });
});