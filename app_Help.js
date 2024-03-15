// Copyright 2024 Joseph P Medley

'use-strict';

global.__commandName = 'Help';

const { printHelp, printWelcome } = require('./utils.js');

global.__basedir = __dirname;

printWelcome();
printHelp();
