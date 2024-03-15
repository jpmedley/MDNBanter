// Copyright 2024 Joseph P Medley

'use strict';


const utils = require('./utils.js');

class CSSSet {
  constructor() {
    this.properties = utils.getJSON('./idl/core/css/css_properties.json5');
    this.propertyMethods = utils.getJSON('./idl/core/css/properties/css_property_methods.json5');
    this.media = {};
    this.media.names = utils.getJSON('./idl/core/css/media_feature_names.json5');
    this.media.types = utils.getJSON('./idl/core/css/media_type_names.json5');
    this.values = utils.getJSON('./idl/core/css/css_primitive_value_units.json5');
    this.values.keywords = utils.getJSON('./idl/core/css/css_value_keywords.json5');
  }

  _findExactProperties(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    this.properties.data.forEach(element => {
      if (element.name === searchValue) {
        foundProperties.push(element);
      }
    });
    return foundProperties;
  }

  _findMatchingProperties(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    this.properties.data.forEach(element => {
      if (element.name.includes(searchValue)) {
        foundProperties.push(element);
      }
    });
    return foundProperties;
  }

  findExact(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    foundProperties.push(...this._findExactProperties(searchValue, includeFlags, includeOriginTrials));
    return foundProperties;
  }

  findMatching(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    foundProperties.push(...this._findMatchingProperties(searchValue, includeFlags, includeOriginTrials));
    return foundProperties;
  }
}

module.exports.CSSSet = CSSSet;