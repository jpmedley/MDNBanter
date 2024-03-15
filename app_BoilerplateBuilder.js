// Copyright 2024 Joseph P Medley

'use-strict';

global.__commandName = 'BoilerplateBuilder';

const { BoilerplateBuilder } = require('./boilerplates.js');
const { printWelcome } = require('./utils.js');
const { update } = require('./updateData.js');

printWelcome();
update(process.argv);

const builder = new BoilerplateBuilder({ mode: process.argv[2]});
builder.build();