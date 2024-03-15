// Copyright 2024 Joseph P Medley

'use strict';

global.__commandName = '';
require('./log.js').initiateLogger('app_Manual');

const { CLIBuilder } = require('./builder.js');
const { printWelcome } = require('./utils.js');

printWelcome();

const builder = new CLIBuilder({ args: process.argv });
builder.build();
