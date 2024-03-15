// Copyright 2024 Joseph P Medley

'use strict';

const fs = require('fs');
const { MultiSelect } = require('enquirer');
const utils = require('./utils.js');

const CANCEL = '(cancel)';

class _Cleaner {
  constructor() {
    this._directories = this._getDirList();
  }

  _getDirList() {
    const dirContents = fs.readdirSync(utils.getOutputDirectory(), {withFileTypes: true});
    let newList = [];
    for (let d of dirContents) {
      if (d.isDirectory()) { newList.push(d); }
    }
    return newList;
  }

  async _select() {
    let dirs = [];
    for (let d of this._directories) { dirs.push(d.name); }
    dirs.push(CANCEL);
    const prompt = new MultiSelect({
      name: 'cleanList',
      message: 'Which output directories do you want to delete?',
      choices: dirs,
      validate: (v) => {
        if (v.length === 0) {
          let msg = "Use arrows to move and the space bar to select. ";
          msg += "You must choose one or more\n  items or '(cancel)' to abandon.";
          return msg;
        }
        if (v.length > 1 && v.includes(CANCEL)) {
          return "Selected items cannot include (cancel). Use the space bar to unselect.";
        }
        return true;
      }
    });
    const answers = await prompt.run();
    return answers;
  }

  async _clean(dirsToDelete) {
    const answer = await utils.confirm("Are you sure?");
    if (answer) {
      console.log("\nRemoving selected directories.");
      for (let d in dirsToDelete) {
        console.log(`\tDeleting ${dirsToDelete[d]}.`);
        utils.deleteUnemptyFolder(utils.getOutputDirectory() + dirsToDelete[d]);
      }
      console.log('\n');
    } else {
      console.log('Will not delete selected directories.\n');
    }

  }

  async clean() {
    let dirsToDelete = await this._select();
    if (dirsToDelete.includes(CANCEL)) {
      const msg = '\nAbandoning cleaning operation as requested.\n';
      console.log(msg);
      return;
    }
    await this._clean(dirsToDelete);
  }
}

module.exports.Cleaner = _Cleaner;
