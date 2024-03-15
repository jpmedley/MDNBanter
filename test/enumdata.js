// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');
const utils = require('../utils.js');

const { EnumData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const ENUM = './test/files/enum.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('EnumData', () => {
  describe('Properties', () => {
    it('Confirms that the name property returns the correct value', () => {
      const enumSource = loadSource(ENUM);
      const es = new EnumData(enumSource, ENUM);
      assert.strictEqual(es.name, 'AudioContextState');
    });
  });
});