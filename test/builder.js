// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');

const { IDLBuilder } = require('../builder.js');
const { InterfaceData } = require('../interfacedata.js');
const path = require('path');
const utils = require('../utils.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

const BURNABLE = './test/files/burnable.idl';

const tempFolder = path.join(__dirname, 'tmp');

describe('IDLBuilder', () => {
  describe('build()', () => {

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms writing of only a BCD file', async () => {
      const source = utils.getIDLFile(BURNABLE, true);
      const id = new InterfaceData(source);
      // outpath needed to not drop junk files in random locations
      const idB = new IDLBuilder({
        bcdPath: tempFolder,
        interfaceData: id,
        bcdOnly: true,
        outPath: tempFolder
      });
      await idB.build('always');
      const contents = fs.readdirSync(tempFolder, {withFileTypes: true});
      const jsonFile = contents.find(c => {
        return c.name === 'Burnable.json';
      });
      assert.strictEqual(jsonFile.name, 'Burnable.json');
    });

    it('Confirms writing of only an interface page', async () => {
      const source = utils.getIDLFile(BURNABLE, true);
      const id = new InterfaceData(source);
      // outpath needed to not drop junk files in random locations
      const idB = new IDLBuilder({
        bcdPath: tempFolder,
        interfaceData: id,
        interfaceOnly: true,
        outPath: tempFolder
      });
      await idB.build('always');
      const interfacePage = path.join(tempFolder, 'burnable');
      const contents = fs.readdirSync(interfacePage, {withFileTypes: true});
      assert.strictEqual(contents.length, 1);
    });

    afterEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
    });
  });
});