// Copyright 2024 Joseph P Medley

'use-strict';

global.__commandName = 'Finder';
require('./log.js').initiateLogger(global.__commandName);

const { FinderFactory } = require('./finder.js');
const { printWelcome } = require('./utils.js');
const { update } = require('./updateData.js');

printWelcome();
update(process.argv);

const finder = FinderFactory(process.argv);
finder.findAndShow();
