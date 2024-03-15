// Copyright 2024 Joseph P Medley

'use strict';

const config = require('config');
const winston = require('winston');

const utils = require('./utils.js');


global.__logger = {};
global.__loggerInitiated = false;

function _initiateLogger(name = '') {
  if (!global.__loggerInitiated) {
    global.__loggerInitiated = true;

    const logLevel = config.get('Application.logLevel');
    const console = new winston.transports.Console();
    global.__logger = winston.createLogger({
      level: logLevel,
      transports: [
        console
      ]
    });

    const logDirectory = utils.resolveHome(config.get('Application.loggingDirectory'));
    let logFileName = utils.makeFolder(logDirectory);
    logFileName += `${name}_${utils.today()}.log`

    const logOutput = config.get('Application.logOutput');
    logOutput.forEach(lo => {
      switch (lo) {
        case 'file':
          const fileTransport = new winston.transports.File({filename: logFileName});
          global.__logger.add(fileTransport);
          break;
      }
    });
    if (!logOutput.includes('console')) {
      global.__logger.remove(console);
    }
  }
}

module.exports.initiateLogger = _initiateLogger;
