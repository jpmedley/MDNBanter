// Copyright 2024 Joseph P Medley

'use strict';

const fs = require('fs');

const { FileProcessor } = require('./fileprocessor.js');
const { initiateLogger } = require('./log.js');
const { InterfaceSet } = require('./interfaceset.js');

const EXCLUSIONS = ['inspector','testing','typed_arrays'];

initiateLogger(global.__commandName);

class DirectoryManager {
  constructor(rootDirectory = 'idl/', options = { types: ['interface']} ) {
    this._root = rootDirectory;
    this._types = options.types;
  }

  _processDirectory(root) {
    const contents = fs.readdirSync(root, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        if (EXCLUSIONS.includes(contents[c].name)) { continue; }
        this._processDirectory(`${root}${contents[c].name}/`);
      } else if (contents[c].isFile()) {
        if (!contents[c].name.endsWith('.idl')) { continue; }
        if (contents[c].name.startsWith('test_')) { continue; }
        try {
          let fp = new FileProcessor(`${root}${contents[c].name}`);
          fp.process((result) => {
            if (this._types.includes(result.type)) {
              if (!result.inTest) {
                this._interfaceSet.add(result);
              }
            }
          });
        } catch (error) {
          global.__logger.info(`Cannot process ${root}${contents[c].name}.`);
        }
      }
    }
  }

  get interfaceSet() {
    if (!this._interfaceSet) {
      this._interfaceSet = new InterfaceSet();
      this._processDirectory(this._root);
      if (this._interfaceSet.count < 1) {
        let msg = `IDL files were not found in ${this._root}. `
        msg += `Run "npm run update-data -- -s" and try again.`;
        console.log(msg);
        process.exit();
      }
    }
    return this._interfaceSet;
  }
}

module.exports.DirectoryManager = DirectoryManager;