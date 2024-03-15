// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');
const utils = require('../utils.js');

const { IncludesData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const MIXIN_INCLUDES = './test/files/mixin-includes.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath, { clean: true });
}

describe('IncludesData', () => {
  describe('Properties', () => {
    it('Confirms that the name property returns the correct value', () => {
      const includesSource = loadSource(MIXIN_INCLUDES);
      const sources = includesSource.split('Including');
      const options = { 
        realSource: sources[0].trim(),
        sourcePath: MIXIN_INCLUDES
      };
      const proximateSource = `Including${sources[1]}`;
      const id = new IncludesData(proximateSource, options);
      assert.strictEqual(id.name, 'Including');
    });
  });
});