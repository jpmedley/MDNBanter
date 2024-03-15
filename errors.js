// Copyright 2024 Joseph P Medley

'use strict';

class BuilderError extends Error {
  constructor(message, fileName, lineNumber) {
    super(message, fileName, lineNumber);
  }
}

class IDLError extends Error {
  constructor(message, fileName, lineNumber) {
    super(message, fileName, lineNumber);
  }
}

module.exports.BuilderError = BuilderError;
module.exports.IDLError = IDLError;