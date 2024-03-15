// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');

const { FileProcessor } = require('../fileprocessor.js');
const { InterfaceSet } = require('../interfaceset.js');

let INTERFACE_SET = new InterfaceSet();

const IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('InterfaceSet', () => {

  before(() => {
    const contents = fs.readdirSync(IDL_FILES, {withFileTypes: true});
    for (const c of contents) {
      if (!c.isFile()) { continue; }
      if (!c.name.endsWith('.idl')) { continue; }
      let fp = new FileProcessor(`${IDL_FILES}${c.name}`);
      fp.process((interfaceObect) => {
        INTERFACE_SET.add(interfaceObect);
      });
    }
  });

  describe('findMatching', () => {
    it('Confirms inclusion of interfaces behind a flag', () => {
      const matches = INTERFACE_SET.findMatching("*", true);
      assert.strictEqual(matches.length, 86);
    })
    it('Confirms return of matching items', ()=> {
      const matches = INTERFACE_SET.findMatching('Burnable');
      assert.strictEqual(matches.length, 2);
    });
    it('Confirms flags returned', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceRTE2', true);
      assert.ok(matches[0].flagged, 'Expected true from InterfaceData.flagged');
    });
    it('Confirms flags not returned when not requested', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceRTE2', false);
      assert.strictEqual(matches.length, 0);
    });
    it('Confirms origin trials returned', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceOT', false, true);
      assert.ok(matches[0].originTrial, 'Expected true from InterfaceData.originTrial');
    });
    it('Confirms origin trials not returned when not requested', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceOT', false, false);
      assert.strictEqual(matches.length, 0);
    });
    it('Confirms a mixin is returned under its implementor\'s name', () => {
      const matches = INTERFACE_SET.findMatching('MixinIncludes', false, false);
      assert.strictEqual(matches.length, 2);
    })
  });
});
