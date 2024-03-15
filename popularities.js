// Copyright 2024 Joseph P Medley

'use strict';

const fs = require('fs');
const { downloadPopularities } = require('./updateData.js');
const { getFile } = require('./utils.js');

class popularities {
  constructor(category, options = {}) {
    this._sourcePath = 'popularities.json';
    if (options.source) { this._sourcePath = options.source }
    this._popularities = this._loadPopularities(category);
  }

  _loadPopularities(filter) {
    if (!fs.existsSync(this._sourcePath)) {
      downloadPopularities();
    }
    const source = getFile(this._sourcePath);
    let someData = source.split(',');
    someData.shift();
    someData.pop();
    if (!filter) { return someData; }
    return someData.filter(f => {
      return f.includes(filter);
    });
  }

  get rawData() {
    return this._popularities;
  }

  getRating(key) {
    let val = this._popularities.find(f => {
      return f.includes(key);
    });
    if (val) {
      val = val.split(":")[1];
      val = val.trim();
    } else {
      val = 0;
    }
    return Number(val);
  }
}

module.exports.Popularities = popularities;