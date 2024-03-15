// Copyright 2024 Joseph P Medley

'use-strict';

global.__commandName = 'Config';

const { displayConfig, printWelcome } = require('./utils.js');

printWelcome();
displayConfig();
