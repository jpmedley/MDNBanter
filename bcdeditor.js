// Copyright 2024 Joseph P Medley

'use strict';

const { BCDBuilder } = require('./bcdbuilder.js');

class JSONError extends Error {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class _BCDEditor {
  constructor(source) {
    this._tree;
    this._validateSourceMakeTree(source);
  }

  _validateSourceMakeTree(source) {
    switch (source.constructor.name) {
      case "InterfaceData":
        const bcdBuilder = new BCDBuilder(source, 'api', {});
        this._tree = bcdBuilder.getBCDObject();
        break;
      case "Object":
        this._tree = source;
        break;
      case "String":
        this._tree = JSON.parse(source);
        break;
      default:
        console.log(source.constructor.name);
        break;
    }
  }

  get tree() {
    return this._tree;
  }
}

module.exports.BCDEditor = _BCDEditor;