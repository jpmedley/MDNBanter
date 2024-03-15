// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const { find } = require('shelljs');

const { Finder } = require('../finder.js');

const TEST_IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('IDLFinder', () => {
  describe('findAndReturn()', () => {
    it('Confirms return of a mixin interface as itself', function(done) {
      this.timeout(15000);
      setTimeout(done, 12000);
      const searchString = ["", "MixinIncludes"];
      let finder = new Finder(searchString, { iDLDirectory: TEST_IDL_FILES });
      finder.findAndReturn()
      .then(ids => {
        const id = ids.find(i => {
          return (i.name === 'MixinIncludes');
        });
        assert.strictEqual(id.name, 'MixinIncludes');
      });
    });

    it('Confirms return of a mixin on the implementing interface', function(done) {
      this.timeout(15000);
      setTimeout(done, 12000);
      const searchString = ["", "Including"];
      let finder = new Finder(searchString, { iDLDirectory: TEST_IDL_FILES });
      finder.findAndReturn()
      .then(ids => {
        const id = ids.find(i => {
          if (i.name === 'Including') {
            assert.ok(true);
            return i;
          }
        });
      });
    });
  });
});