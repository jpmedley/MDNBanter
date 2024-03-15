// Copyright 2024 Joseph P Medley

'use-strict';

global.__commandName = 'Burner';

const { BurnerFactory } = require('./burner.js');
const { printWelcome } = require('./utils.js');
const { updateForAdmin } = require('./updateData.js');

printWelcome();
// updateForAdmin();

const burner = BurnerFactory(process.argv);
burner.burn();
