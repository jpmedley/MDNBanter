// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');
const Validator = require('jsonschema').Validator;

const { BCDBuilder } = require('../bcdbuilder.js');
const { FileProcessor } = require('../fileprocessor.js');
const utils = require('../utils.js');

const EXPECTED_UAS = ["chrome", "chrome_android", "edge", "edge_mobile", "firefox", "firefox_android", "ie", "nodejs", "opera", "opera_android", "qq_android", "safari", "safari_ios", "samsunginternet_android", "uc_android", "uc_chinese_android", "webview_android"];

const BURNABLE = './test/files/burnable.idl';

const tempFolder = 'tmp/';
const jsonPath = `${tempFolder}test-bcd.json`;

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('BCDBuilder', () => {
  describe('write()', () => {

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that a BCD file is written', () => {
      let id;
      const fp = new FileProcessor(BURNABLE);
      fp.process((result) => {
        id = result;
      }, true)
      const bcdManager = new BCDBuilder(id, 'api', {});
      bcdManager.getBCDObject(jsonPath);
      bcdManager.write(jsonPath);
      assert.ok(fs.existsSync(jsonPath));
    });

    it('Confirms that the written BCD file is valid', () => {
      // Write a BCD file
      let id;
      const fp = new FileProcessor(BURNABLE);
      fp.process((result) => {
        id = result;
      }, true)
      const bcdManager = new BCDBuilder(id, 'api', {});
      bcdManager.getBCDObject(jsonPath);
      bcdManager.write(jsonPath);
      // Load the schema
      let buffer = fs.readFileSync('test/files/compat-data.schema.json');
      const schema = [buffer.toString()];
      // Load the new BCD file
      buffer = fs.readFileSync(jsonPath);
      const burnableBCD = JSON.parse(buffer.toString()).api;
      const validator = new Validator();
      // Compare
      const result = validator.validate(burnableBCD, schema);
      assert.ok(result.errors.length === 0);
    });

    it('Confirms that the written BCD file is correctly nested', () => {
      // Write and load a BCD file
      let id;
      const fp = new FileProcessor(BURNABLE);
      fp.process((result) => {
        id = result
      }, true)
      const bcdManager = new BCDBuilder(id, 'api', {});
      bcdManager.getBCDObject(jsonPath);
      bcdManager.write(jsonPath);
      const resultString = fs.readFileSync(jsonPath).toString();
      // Load a correctly-nested version of what was written and compare
      const comparisonString = fs.readFileSync('test/files/properly-nested-bcd.json').toString();
      assert.strictEqual(resultString, comparisonString);
    });

    it('Confirms that browsers are in the correct order in a written BCD file', () => {
      // Write and load a BCD file
      let id;
      const fp = new FileProcessor(BURNABLE);
      fp.process((result) => {
        id = result;
      }, true)
      const bcdManager = new BCDBuilder(id, 'api', {});
      bcdManager.getBCDObject(jsonPath);
      bcdManager.write(jsonPath);
      const resultString = fs.readFileSync(jsonPath).toString();
      // Cut BCD file into lines and extract user agent names
      const bcdLines = resultString.split('\n');
      const regex = /"(\w+)":\s{/;
      let fileIncludes = [];
      for (let b of bcdLines) {
        // Record UA names as they are found 
        let matches = b.match(regex);
        if (!matches) { continue; }
        let possibleUA = matches[1];
        if (EXPECTED_UAS.includes(possibleUA)) {
          if (fileIncludes.includes(possibleUA)) { continue; }
          fileIncludes.push(possibleUA);
        }
      }
      // Test that UA names are alphabetical
      const alphabetical = [...fileIncludes];
      alphabetical.sort();
      assert.deepStrictEqual(fileIncludes, alphabetical);
    });

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  });

  describe('getBCDObject()', () => {
    it('Confirms that it returns a structure', () => {
      let id;
      const fp = new FileProcessor(BURNABLE);
      fp.process((result) => {
        id = result;
      }, true)
      const bcdManager = new BCDBuilder(id, 'api', {});
      const bcd = bcdManager.getBCDObject(jsonPath);
      assert.notEqual(bcd, null);
    });
  });
});