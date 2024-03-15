// Copyright 2024 Joseph P Medley

'use-strict';

global.__commandName = 'Cleaner';

const { Cleaner } = require('./cleaner.js');
const { printWelcome } = require('./utils.js');

printWelcome();

const cleaner = new Cleaner();
cleaner.clean();
