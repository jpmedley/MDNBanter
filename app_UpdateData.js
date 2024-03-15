// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = 'UpdateData';

const { printWelcome } = require('./utils.js');
const updateData = require('./updateData.js');

printWelcome();
if (process.argv[2] == 'show') {
  updateData.showVersions();
} else {
  updateData.updateNow(process.argv);
}
