// Copyright 2024 Joseph P Medley

'use strict';

const fs = require('fs');

const { bcd } = require('./bcd.js');
const { IDLError } = require('./errors.js');
const { FlagStatus } = require('./flags.js')
const { Pinger } = require('./pinger.js');
const utils = require('./utils.js');

const CALLBACK_NAME_RE = /callback\s*(\w*)\s*=[^;]*;/;
const DICTIONARY_NAME_RE = /dictionary\s(\w+)/;
const ENUM_NAME_RE = /enum\s(\w+)/;
const INCLUDES_NAME_RE = /^\s?(\w*)\s*includes\s*(\w*)\s*;/m;
const INTERFACE_DEFINITION_RE = /(callback|partial)?\s*interface\s*(mixin)?\s*(\w+)/;

const CONSTRUCTOR_RE = /(\[(([^\]]*))\])?\sconstructor(\([^;]*)/g;
const EXTENDED_ATTRIBUTES_INTERFACE_RE = /\[([^\]]*)\]\s+interface/m;
const INSIDE_PARENS_RE = /\(([^\)]*)\)/;
const INTERFACE_INHERITANCE_RE = /interface\s([^{]+){/;

const RUNTINE_ENABLED = /RuntimeEnabled=([^,\n]*)/;

const CONSTRUCTOR = Object.freeze({
  "arguments": [],
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "Constructor"
});

const DELETER = Object.freeze({
  "arguments": [],
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "Deleter"
});

const EVENT_HANDLER = Object.freeze({
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "EventHandler"
});

const GETTER = Object.freeze({
  "arguments": [],
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "returnType": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "Getter"
});

const ITERABLE = Object.freeze({
  "arguments": [],
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "Iterable"
});

const METHOD = Object.freeze({
  "arguments": [],
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "returnType": null,
  "resolution": null,
  "source": null,
  "static": false,
  "tree": this.source, // Needed for Backward compatibility
  "type": "method"
});

const PROPERTY = Object.freeze({
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "readOnly": false,
  "returnType": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "property"
});

const SETTER = Object.freeze({
  "arguments": [],
  "flag": this.flagged, // Needed for Backward compatibility
  "flagged": null,
  "name": null,
  "originTrial": null,
  "path": null,
  "source": null,
  "tree": this.source, // Needed for Backward compatibility
  "type": "Setter"
});

let FLAGS= new FlagStatus('./idl/platform/runtime_enabled_features.json5');

class IDLData {
  constructor(source, options = {}) {
    this._sourceData = source;
    this._sourcePath = options.sourcePath;
    this._flagged = null;
    this._key;
    this._keys = [];
    this._members = [];
    this._name;
    this._originTrial = null;
    this._sources = [];
  }

  get flagged() {
    if (this._flagged) { return this._flagged; }
    this._flagged = false;
    const flagName = this._getAttributeValue(RUNTINE_ENABLED);
    if (flagName) {
      const status = FLAGS.getHighestResolvedStatus(flagName);
      this._flagged = ((status === 'experimental') || (status === 'test'));
    }
    return this._flagged;
  }

  get key() {
    if (!this._key) {
      this._key = utils.getAlternateKey(this.name);
    }
    if (!this._key) {
      this._key = this.name;
    }
    return this._key;
  }

  get sourceContents() {
    return this._sourceData;
  }

  get originTrial() {
    if (this._originTrial) { return this._originTrial}
    // Sometimes OT status is not represented correctly in the source files, so 
    //   check the curated list.
    this._originTrial = utils.isOTFalseNegative(this.name);
    if (!this._originTrial) {
      this._originTrial = this._getRuntimeEnabledValue("origintrial", this._getInterfaceExtendedAttributes());
      return this._originTrial;
    }
  }

  set originTrial(originTrial) {
    this._originTrial = originTrial;
  }

  get path() {
    return this._sourcePath;
  }

  get type() {
    return this._type;
  }

  writeKeys(keyFile, includeFlags = false) {
    let tempMembers = this.getMembers(includeFlags);
    let tempKeys = [this.name];
    tempMembers.forEach(member => {
      if (!tempKeys.includes(member.name)) {
        tempKeys.push(member.name);
      }
    });
    const keyList = tempKeys.join("\n");
    fs.appendFileSync(keyFile, keyList);
  }

  getBurnRecords() {
    let record = bcd.getRecordByKey(this.key, 'api');
    record.flag = this._flagged;
    record.name = this.key;
    record.origin_trial = this._originTrial;
    record.type = this.type;
    const engines = bcd.getEngines(this.key, 'api');
    record.engineCount = (engines? engines.length: 1);
    const browserCount = bcd.getBrowsers(this.key, 'api');
    record.browserCount = (browserCount? browserCount.length: 6);
    const browsers = ['chrome', 'chrome_android', 'webview_android'];
    const versions = bcd.getVersions(this.key, browsers, 'api');
    record.versions = versions;
    return new Array(record);
  }

  async ping(verboseOutput = true) {
    let pingRecords = this.getBurnRecords();
    const pinger = new Pinger(pingRecords);
    if (verboseOutput) {
      utils.sendUserOutput('\nChecking for existing MDN pages. This may take a few minutes.');
    }
    let records = await pinger.pingRecords()
    .catch(e => {
      throw e;
    });
    return records;
  }
}

class CallbackData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "callback";
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(CALLBACK_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }
}

class DictionaryData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "dictionary";
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(DICTIONARY_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }
}

class EnumData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "enum";
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(ENUM_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }
}

class InterfaceData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "interface";
    this._constructors = [];
    this._deleters = [];
    this._eventHandlers = [];
    this._events = [];
    this._exposed = null;
    this._extendedAttributes = null;
    this._getters = [];
    this._hasConstructor = null;
    this._inTest = null;
    this._iterable = [];
    this._maplike = [];
    this._methods = [];
    this._mixin = false;
    this._parentClass = null;
    this._properties = [];
    this._setlike = [];
    this._setters = [];
    this._rawExtendedAttributes = null;
    this._processSource();
  }

  _filter(find) {
    return this._sources.filter(source => {
      return source.includes(find);
    });
  }

  _processHeader() {
    let matches = this._sourceData.match(INTERFACE_DEFINITION_RE);
    if (!matches) {
      let msg = `Problem processing ${this._sourcePath}.\n`
      throw new IDLError(msg, this.fileName);
    }
    if (matches[2]) {
      this._mixin = true;
    }
    this._name = matches[3];
  }

  // Long term, this should replace _getInterfaceExtendedAttributes(),
  // which is inadequate to the variety of formatting
  _processExtendedAttributes() {
    if (this._rawExtendedAttributes) { return; }
    let matches = this._sourceData.match(EXTENDED_ATTRIBUTES_INTERFACE_RE);
    if (matches) {
      this._rawExtendedAttributes = matches[1].trim();
    }
  }

  _processSource() {
    this._processExtendedAttributes();
    this._processHeader();
    let recording = false;
    const lines = this._sourceData.split('\n');
    let sources = [];
    for (let l of lines) {
      if (l.includes('};')) { recording = false; }
      if (recording) {
        if (l.trim() == "") { continue; }
        if (l.startsWith("//")) { continue; }
        sources.push(l);
      }
      if (l.includes('interface')) { recording = true; }
    }
    // Take it apart and put it back together so that inline extended attributes
    // are actually inline with the members they support.
    let temp = sources.join(" ");
    this._sources = temp.split(";");
    const end = this._sources.length - 1;
    if (this._sources[end] == "") { this._sources.pop(); }

    try {
      // TO DO: Add processing of const
      this._getConstructors();
      this._getDeleters();
      this._getEventHandlers();
      this._getGetters();
      this._getIterables();
      this._getMaplikeMethods();
      this._getMethods();
      this._getProperties();
      this._getSetters();
      this._getSetlikeMethods();
    } catch (error) {
      let msg = `Problem processing ${this._sourcePath}.\n`
      msg += `${error.message}\n${error.stack}`;
      throw new IDLError(msg, error.fileName, error.lineNumber);
    }
  }

  _getRuntimeEnabledValue(expectedStatus, fromAttributes) {

    if (!fromAttributes) { return false; }
    const flagName = fromAttributes.find(ea => {
      return ea.includes("RuntimeEnabled");
    });
    if (flagName) {
      const pieces = flagName.split("=");
      const status = FLAGS.getHighestResolvedStatus(pieces[1]);
      return (status === expectedStatus);
    }
    return false;
  }

  _getRuntimeEnabledValue__(expectedStatus, forFlag) {
    let status = FLAGS.getHighestResolvedStatus(forFlag);
    return (status === expectedStatus);
  }

  _getInlineExtendedAttributes(source, dataObject) {
    const matches = source.match(/\[?([^\]]*)\]?/);
    const sources = matches[1].split(",");
    sources.forEach(elem => {
      let elems = elem.split("=");
      switch (elems[0]) {
        case "RuntimeEnabled":
          dataObject.flagged = dataObject.flagged || this._getRuntimeEnabledValue__("experimental", elems[1]);
          dataObject.originTrial = dataObject.originTrial || this._getRuntimeEnabledValue__("origintrial", elems[1]);
          break;
        default:
          break;
      }
    })
  }

  _getInterfaceExtendedAttributes() {
    if (this._extendedAttributes) { return this._extendedAttributes; }
    // let matches = this._rawExtendedAttributes;
    let matches = this._sourceData.match(EXTENDED_ATTRIBUTES_INTERFACE_RE);
    if (matches) {
      let realMatches = matches[1].trim();
      this._extendedAttributes = realMatches.split("\n");
    }
    if (this._extendedAttributes) {
      this._extendedAttributes.forEach((attrib, i, eas) => {
        eas[i] = attrib.trim();
        if (eas[i].endsWith(",")) {
          eas[i] = eas[i].substring(0, (eas[i].length - 1));
        }
      });
    }
    return this._extendedAttributes;
  }

  _cloneObject(parent) {
    let newObject = JSON.parse(JSON.stringify(parent))
    newObject.flagged = this.flagged;
    newObject.originTrial = this.originTrial;
    newObject.path = this._path;
    return newObject;
  }

  _getConstructors() {
    const sources = this._filter('constructor');
    sources.forEach(source => {
      let newConstructorData = this._cloneObject(CONSTRUCTOR);
      newConstructorData.source = source.trim();

      let workingString = newConstructorData.source;
        if (workingString.startsWith("[")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newConstructorData);
        workingString = pieces[1].trim();
      }

      newConstructorData.name = this.name;
      let pieces = workingString.split("constructor");
      if (!pieces[1].includes("()")) {
        workingString = pieces[1].trim();
        workingString = workingString.slice(0, -1).slice(1); //Remove parens and ';'
        newConstructorData.arguments = workingString.split(",");
        newConstructorData.arguments.forEach((arg, i, args) => {
          args[i] = arg.trim();
        });
      }

      this._constructors.push(JSON.parse(JSON.stringify(newConstructorData)));
    });
  }

  get constructors() {
    return this._constructors;
  }

  _getDeleters() {
    const sources = this._filter('deleter');
    sources.forEach(source => {
      let newDeleterData = this._cloneObject(DELETER);
      newDeleterData.source = source.trim();

      let workingString = newDeleterData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newDeleterData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split("(");
      let sigs = pieces[0].split(" "); // pieces of the signature
      if (sigs[2]) { newDeleterData.name = sigs[2]; }
      if (!pieces[1].includes("()")) {
        workingString = pieces[1].trim();
        workingString = workingString.slice(0, -1).slice(1); //Remove parens and ';'
        newDeleterData.arguments = workingString.split(",");
        newDeleterData.arguments.forEach((arg, i, args) => {
          args[i] = arg.trim();
        });
      }
      this._deleters.push(JSON.parse(JSON.stringify(newDeleterData)));
    });
  }

  get deleters() {
    return this._deleters;
  }

  _getEventHandlers() {
    const sources = this._filter('EventHandler');
    sources.forEach(source => {
      let newEventHandler = this._cloneObject(EVENT_HANDLER);
      newEventHandler.source = source.trim();
      
      let workingString = newEventHandler.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newEventHandler);
        workingString = pieces[1].trim();
      }
      
      let pieces = workingString.split(" ");
      newEventHandler.name = pieces[2].trim();
      this._eventHandlers.push(JSON.parse(JSON.stringify(newEventHandler)));
      const event = newEventHandler.name.split('on')[1];
      this._events.push(event);
    });
  }

  _getAttributeValue(regex) {
    if (!this._rawExtendedAttributes) { return null; }
    const matches = this._rawExtendedAttributes.match(regex);
    if (matches) {
      return matches[1].trim();
    }
    return null;
  }

  get eventHandlers() {
    return this._eventHandlers;
  }

  get exposed() {
    if (this._exposed) { return this._exposed; }
    let extAttributes = this._getInterfaceExtendedAttributes();
    if (extAttributes) {
      let exposed = extAttributes.find(attrib => {
        return attrib.includes("Exposed");
      });
      if (exposed) {
        let exposedOn = exposed.split("=")[1];
        if (exposedOn.includes("(")) {
          let inParens = exposedOn.match(INSIDE_PARENS_RE);
          exposedOn = inParens[1];
        }
        this._exposed = exposedOn.split(",");
        if (this._exposed[this._exposed.length - 1] === "") {
          this._exposed.pop();
        }
      }
    }
    return this._exposed;
  }

  _getGetters() {
    const sources = this._filter('getter');
    let register = [];
    sources.forEach(source => {
      let newGetterData = this._cloneObject(GETTER);
      newGetterData.source = source.trim();

      // Extract extended attributes
      let workingString = newGetterData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newGetterData);
        workingString = pieces[1].trim();
      }

      // Extract arguments
      let pieces = workingString.split("(");
      // Arguments are last item
      let argsString = pieces[pieces.length - 1];
      argsString = argsString.slice(0, -1);
      let args = argsString.split(",");
      args.forEach((arg, i, args) => {
        args[i] = arg.trim();
        if (arg!="") { newGetterData.arguments.push(arg); }
      });

      workingString = pieces[pieces.length - 2];
      pieces = workingString.split(" ");
      if (pieces[pieces.length - 1]) {
        // Named getter is last item
        newGetterData.name = pieces[pieces.length - 1];
        newGetterData.type = 'method';
      } else {
        // Unnamed getter
        newGetterData.name = "(getter)";
      }
      pieces.pop();
      workingString = pieces.join(" ");
      if ((workingString.includes(")")) && (!workingString.includes("("))) {
        workingString = `(${workingString}`;
      }
      if (workingString.startsWith("getter")) {
        let temp = workingString.split("getter");
        workingString = temp[temp.length - 1].trim();
      }
      newGetterData.returnType = workingString;
      if (!register.includes(newGetterData.name)) {
        register.push(newGetterData.name);
        this._getters.push(JSON.parse(JSON.stringify(newGetterData)));
      }
    });
  }

  get getters() {
    return this._getters
  }

  get hasConstructor() {
    if (this._hasConstructor) { return this._hasConstructor; }
    let matches = this._sourceData.match(CONSTRUCTOR_RE);
    if (matches) {
      this._hasConstructor = true;
    } else {
      this._hasConstructor = false;
    }
    return this._hasConstructor;
  }

  get inTest() {
    if (this._inTest) { return this._inTest}
    this._inTest = this._getRuntimeEnabledValue("test", this._getInterfaceExtendedAttributes());
    return this._inTest;
  }

  _getIterables() {
    const sources = this._filter('iterable');
    if (sources.length === 0) { return; }
    let newIterable = this._cloneObject(ITERABLE);
    newIterable.source = sources[0].trim();

    let workingString = newIterable.source;
    if (workingString.includes("]")) {
      let pieces = workingString.split("]");
      this._getInlineExtendedAttributes(pieces[0], newIterable);
      workingString = pieces[1].trim();
    }

    newIterable.name = "(iterable)";
    let pieces = workingString.split("iterable");
    workingString = pieces[1].trim();
    workingString = workingString.slice(0, -1).slice(1); //Remove brackets and ';'
    if (!workingString.includes(",")) {
      newIterable.arguments.push(workingString)
    } else {
      let args = workingString.split(",");
      newIterable.arguments.push(...args);
    }
    newIterable.arguments.forEach((arg, i, args) => {
      args[i] = arg.trim();
    })
    this._iterable.push(newIterable);
  }

  get iterable() {
    return this._iterable;
  }

  get keys() {
    if (this._keys.length > 0) { return this._keys; }
    this._keys.push(this.name);
    if (this.hasConstructor) { this._keys.push('constructor'); }
    this.deleters.forEach(deleter => {
      this._keys.push(deleter.name);
    });
    this.eventHandlers.forEach(handler => {
      this._keys.push(handler.name);
    });
    this.getters.forEach(getter => {
      this._keys.push(getter.name);
    });
    this.iterable.forEach(iter => {
      this._keys.push(iter.name);
    });
    this.maplikeMethods.forEach(maplike => {
      this._keys.push(maplike.name);
    })
    this.methods.forEach(member => {
      if (!this._keys.includes(member.name)) {
        this._keys.push(member.name);
      }
    });
    this.properties.forEach(property => {
      this._keys.push(property.name);
    });
    this.setters.forEach(setter => {
      this._keys.push(setter.name);
    });
    return this._keys;
  }

  _getMaplikeMethods() {
    const sources = this._filter('maplike');
    if (sources.length === 0) { return; }
    let extendedAttribs;
    if (sources[0].includes("]")) { 
      let pieces = sources[0].split("]");
      extendedAttribs = pieces[0].trim();
    }

    let mlMethods = ["entries", "forEach", "get", "has", "keys", "size", "values"];
    let mlReturns = ["sequence", "void", "", "boolean", "sequence", "long long", "sequence"];
    if (!sources[0].includes("readonly")) {
      mlMethods.push(...["clear", "delete", "set"]);
      mlReturns.push(...["void", "void", "void"]);
    }

    mlMethods.forEach((method, i) => {
      let newMethod = this._cloneObject(METHOD);
      newMethod.name = method;
      newMethod.returnType = mlReturns[i];
      if (extendedAttribs) {
        this._getInlineExtendedAttributes(extendedAttribs, newMethod);
      }
      newMethod.source = sources[0].trim();
      this._maplike.push(newMethod);
    });
    
  }

  get maplikeMethods() {
    return this._maplike;
  }

  _getMethods() {
    // The space in 'attribute ' prevents the find from excluding items
    // containing 'attributes'.
    const nonMethods = [
      'attribute ',
      'const',
      'constructor',
      'deleter',
      'EventHandler',
      'getter',
      'iterable',
      'maplike',
      'setlike',
      'setter'
    ];
    let sources = [];
    let register = [];
    this._sources.forEach((elem, i, elems) => {
      const found = nonMethods.some((nonMethod, i, nonMethods) => {
        return elem.includes(nonMethod);
      });
      if (!found) {
        if (!this._methods) { this._methods = []; }
        sources.push(elem);
      }
    });
    if (sources.length === 0) { return; }

    sources.forEach(source => {
      let newMethodData = this._cloneObject(METHOD);
      newMethodData.source = source.trim();

      if (newMethodData.source === 'stringifier') {
        newMethodData.name = 'toString';
        newMethodData.returnType = 'String';
        this._methods.push(newMethodData);
        return;
      }

      let pieces;
      if (source.includes('<')) {
        pieces = source.match(/(\[([^\]]*)\])(\sstatic)?(\s\w*\b<.*>(?!>))\s(\w*)\(([^\)]*)\)/);
      } else {
        // pieces = source.match(/(\[([^\]]*)\])?(\sstatic)?\s*(\w*)\s(\w*)\(([^\)]*)\)/);
        pieces = source.match(/(\[([^\]]*)\])?(\sstatic)?\s*(\w*\??)\s(\w*)\(([^\)]*)\)/);
      }

      if (pieces) {
        if (pieces[2]) {
          this._getInlineExtendedAttributes(pieces[1], newMethodData);
        }
        if (pieces[3]) {
          newMethodData.static = true;
        }
        newMethodData.returnType = pieces[4].trim();
        if (newMethodData.returnType.startsWith('Promise')) {
          let resolution = pieces[4].split('<');
          resolution[1] = resolution[1].slice(0,-1);
          newMethodData.resolution = resolution[1];
        }
        newMethodData.name = pieces[5].trim();
        if (pieces[6]) {
          let args = pieces[6].split(",");
          args.forEach((arg, i, args) => {
            let temp = arg.trim();
            if (temp != "") {
              newMethodData.arguments.push(temp);
            }
          });
        }
        this._methods.push(newMethodData);
      }
    });
  }

  get methods() {
    return this._methods
  }

  get mixin() {
    return this._mixin;
  }

  get name() {
    return this._name;
  }

  get namedGetters() {
    return this._getters.filter(getter => {
      if (getter.name === "(getter)") { return false; }
      return getter.name != "";
    });
  }

  get namedSetters() {
    return this._setters.filter(setter => {
      if (setter.name === "(setter)") { return false; }
      return setter.name != "";
    })
  }

  get parentClass() {
    if (this._parentClass) { return this._parentClass; }
    let matches = this._sourceData.match(INTERFACE_INHERITANCE_RE);
    if (matches) {
      let names = matches[1].split(":");
      if (names[1]) { this._parentClass = names[1].trim(); }
    }
    return this._parentClass;
  }

  _getProperties() {
    // The space in 'attribute ' prevents the find from returning items
    // containing 'attributes'.
    const sources = this._filter('attribute ');
    sources.forEach(source => {
      if (source.includes('EventHandler')) { return; }
      let newPropertyData = this._cloneObject(PROPERTY);
      newPropertyData.source = source.trim();

      let workingString = newPropertyData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newPropertyData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split(" ")
      pieces = pieces.reverse();
      newPropertyData.name = pieces[0];
      newPropertyData.returnType = pieces[1];
      if (pieces[3]) { newPropertyData.readOnly = true; }

      this._properties.push(newPropertyData);
    });
  }

  get properties() {
    return this._properties;
  }

  get readOnlyProperties() {
    return this._properties.filter(prop => {
      return prop.readOnly === true;
    });
  }

  get readWriteProperties() {
    return this._properties.filter(prop => {
      return prop.readOnly === false;
    });
  }

  get secureContext() {
    let extAttributes = this._getInterfaceExtendedAttributes();
    if (!extAttributes) { return false; }
    return extAttributes.includes("SecureContext");
  }

  // Backward compatibility
  getSecureContext() {
    return this.secureContext;
  }


  _getSetlikeMethods() {
    const sources = this._filter('setlike');
    if (sources.length === 0) { return; }
    let extendedAttribs;
    if (sources[0].includes("]")) { 
      let pieces = sources[0].split("]");
      extendedAttribs = pieces[0].trim();
    }

    let slMethods = ["entries", "forEach", "has", "keys", "size", "values"];
    let slReturns = ["sequence", "void", "boolean", "sequence", "long long", "sequence"];
    if (!sources[0].includes("readonly")) {
      slMethods.push(...["add", "clear", "delete"]);
      slReturns.push(...["void", "void", "void"]);
    }

    slMethods.forEach((method, i) => {
      let newMethod = this._cloneObject(METHOD);
      newMethod.name = method;
      newMethod.returnType = slReturns[i];
      if (extendedAttribs) {
        this._getInlineExtendedAttributes(extendedAttribs, newMethod);
      }
      newMethod.source = sources[0].trim();
      this._setlike.push(newMethod);
    });
  }

  get setlikeMethods() {
    return this._setlike;
  }

  _getSetters() {
    const sources = this._filter('setter');
    let register = [];
    sources.forEach(source => {
      let newSetterData = this._cloneObject(SETTER);
      newSetterData.source = source.trim();

      let workingString = newSetterData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newSetterData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split("(");
      let argString = pieces[1];
      argString = argString.slice(0, -1);
      let args = argString.split(",");
      args.forEach((arg, i, args) => {
        args[i] = arg.trim();
        if (arg != "") { newSetterData.arguments.push(arg);}
      });

      workingString = pieces[0];
      pieces = workingString.split(" ");
      newSetterData.returnType = pieces[1];
      if (pieces[2]) {
        newSetterData.name = pieces[2];
      } else {
        newSetterData.name = "(setter)";
      } 

      if (!register.includes(newSetterData.name)) {
        register.push(newSetterData.name);
        this._setters.push(JSON.parse(JSON.stringify(newSetterData)));
      }
    });
  }

  get setters() {
    return this._setters;
  }

  get signatures() {
    // Needed for backward comapatibility.
    let signatures = [];
    let constrs = this.constructors;
    constrs.forEach(elem => {
      let args = elem.arguments.join(", ");
      signatures.push(`constructor(${args})`);
    });
    return signatures;
  }

  get unnamedGetter() {
    return this._getters.filter(getter => {
      if (getter.name != "(getter)") { return false; }
      return new Boolean(getter.name);
    });
  }

  get unnamedSetter() {
    return this._setters.filter(setter => {
      if (setter.name != "(setter)") { return false; }
      return new Boolean(setter.name);
    });
  }

  getInterfaceBurnRecords() {
    return super.getBurnRecords();
  }

  getBurnRecords(includeFlags = false, includeOriginTrials = false) {
    // Call on super gets the burn record for the interface itself.
    let records = super.getBurnRecords();
    let members = this.getMembers(includeFlags, includeOriginTrials, false);
    let record;
    for (let m of members) {
      if (!includeFlags && m._flagged) { continue; }
      if (!includeOriginTrials && m._originTrial) { continue; }
      record = this._buildRecord(m);
      records.push(record);
    }
    if (this.maplikeMethods) {
      let maklike = this.maplikeMethods;
      for (let mm of maklike) {
        if (!includeFlags && mm._flagged) { continue; }
        if (!includeOriginTrials && mm._originTrial) { continue; }
        record = this._buildRecord(mm);
        records.push(record);
      }
    }
    if (this.setlikeMethods) {
      let setlike = this.setlikeMethods;
      for (let s of setlike) {
        if (!includeFlags && s._flagged) { continue; }
        if (!includeOriginTrials && s._originTrial) { continue; }
        record = this._buildRecord(s);
        records.push(record);
      }
    }
    return records;
  }

  _buildRecord(member) {
    let compoundKey = `${this.key}.${member.name}`
    let record = bcd.getRecordByKey(compoundKey, 'api');
    record.flag = member.flagged;
    record.name = member.name;
    record.origin_trial = member.originTrial;
    record.type = member.type;
    const engines = bcd.getEngines(compoundKey, 'api');
    record.engineCount = (engines? engines.length: 1);
    const browserCount = bcd.getBrowsers(compoundKey, 'api');
    record.browserCount = (browserCount? browserCount.length: 6);
    const browsers = ['chrome', 'chrome_android', 'webview_android'];
    const versions = bcd.getVersions(compoundKey, browsers, 'api');
    record.versions = versions;
    return record;
  }

  getMembersBurnRecords(key, includeFlags = false, includeOriginTrials = false) {
    let steps = key.split(".");
    if (steps.length > 1) {
      let records = super.getBurnRecords();
      steps.shift();
      let members = this.getMembers(includeFlags, includeOriginTrials);
      for (let m of members) {
        if (!steps.includes(m.name)) { continue; }
        if (!includeFlags && m._flagged) { continue; }
        if (!includeOriginTrials && m._originTrial) { continue; }
        let record = this._buildRecord(m);
        records.push(record);
      }
      return records;
    } else {
      return this.getBurnRecords(includeFlags, includeOriginTrials);
    }
  }

  // Replacement interface
  getMembers(arg1, arg2, arg3) {
    if(typeof arg1 === 'boolean') {
      return this.getMembers_(arg1, arg2, arg3);
    } else {
      let flags = arg1.includeFlags || false;
      let originTrials = arg1.includeOriginTrials || false;
      let includeUnamed = arg1.includeUnamed || false;
      return this.getMembers(flags, originTrials, includeUnamed);
    }
  }

  getMembers_(inlcudeFlags = false, includeOriginTrials = false, includeUnamed = true) {
    if (this._members.length > 0) { return this._members; }

    function _filterByFlag(member) {
      if ((member.flagged==true) && (inlcudeFlags==false)) { return false; }
      if ((member.originTrial==true) && (includeOriginTrials==false)) { return false; }
      return true;
    }
    
    let temp = this.constructors.filter(_filterByFlag);
    if (temp.length > 0) { this._members.push(...temp); }
    temp = this.eventHandlers.filter(_filterByFlag);
    if (temp.length > 0) { this._members.push(...temp); }
    temp = this.methods.filter(_filterByFlag);
    if (temp.length > 0) { this._members.push(...temp); }
    temp = this.properties.filter(_filterByFlag);
    if (temp.length > 0) { this._members.push(...temp); }

    let getters;
    let setters;
    if (includeUnamed) {
      getters = this.getters.filter(_filterByFlag);
      setters = this.setters.filter(_filterByFlag);

      temp = this.deleters.filter(_filterByFlag);
      if (temp.length > 0) { this._members.push(...temp); }
      temp = this.iterable.filter(_filterByFlag);
      if (temp.length > 0) { this._members.push(...temp); }
    } else {
      getters = this.namedGetters.filter(_filterByFlag);
      setters = this.namedSetters.filter(_filterByFlag);
    }
    if (getters.length > 0) { this._members.push(...getters); }
    if (setters.length > 0) { this._members.push(...setters); }

    this._members.sort((a, b) => {
      if (a.name > b.name) { return 1; }
      if (a.name < b.name) { return -1; }
      return 0
    });

    return this._members;
  }
}

class IncludesData extends InterfaceData {
  constructor(source, options={}) {
    super(options.realSource, options);
    this._type = "includes";
    let matches = source.match(INCLUDES_NAME_RE);
    if (!matches) {
      const msg = `Malformed includes statement in ${this._sourcePath}.`
      throw new IDLError(msg, 'interfacedata.js');
    }
    this._name = matches[1];
    this._mixinName = matches[2];
  }

  set flagged(flag) {
    this._flagged = flag;
  }

  get mixinName() {
    return this._mixinName;
  }

  set originTrial(originTrial) {
    this._originTrial = originTrial;
  }
}

module.exports.CallbackData = CallbackData;
module.exports.DictionaryData = DictionaryData;
module.exports.EnumData = EnumData;
module.exports.IncludesData = IncludesData;
module.exports.InterfaceData = InterfaceData;