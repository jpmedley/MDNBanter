// Copyright 2024 Joseph P Medley, 'README.md'];
    utils.deleteFolderContents(utils.getOutputDirectory(), projectFiles);
  }

  _resolveBuildMode(action) {
    switch (action.toLowerCase()) {
      case 'stable':
        return this._buildStable;
      case 'ot':
      case 'origintrials':
        return this._buildOriginTrials;
      default:
        const msg = `The action must be one of \'Stable\' or \'OriginTrials\'. The value ${action} was provided`;
        console.log(msg);
        process.exit();
    }
  }

  async _buildOriginTrials() {
    let msg = `Now building interface boilerplates for all found Chrome origin trials.\n`;
    msg += `This may take a minute or two.`;
    let outPath = utils.resolveHome(config.get('Application.otDraftsDirectory'));
    console.log(msg);
    let builderOptions = {
      interfaceOnly: true,
      mode: 'batch',
      withholdBCD: true,
      outPath: outPath,
    }
    for (let i = 0; i < this._interfaces.length; i++) {
      if (!this._interfaces[i].originTrial) { continue; }
      builderOptions.interfaceData = this._interfaces[i];
      const builder = new IDLBuilder(builderOptions);
      await builder.build('never');
    }
    msg = `\nBoilerplates written to ${builderOptions.outPath}.`
    console.log(msg);
  }

  async _buildStable() {
    let msg = `\nNow building boilerplates for all outstanding Chrome platform APIs.\n`;
    msg += `This may take a few minutes.`;
    console.log(msg);
    let builderOptions = {
      mode: 'batch',
      outPath: utils.resolveHome(config.get('Application.boilerplatesDirectory'))
    }
    for (let i = 0; i < this._interfaces.length; i++) {
      if (this._interfaces[i].flagged) { continue; }
      if (this._interfaces[i].originTrial) { continue; }
      if (this._interfaces[i].mixin) { continue; }
      builderOptions.interfaceData = this._interfaces[i];
      const builder = new IDLBuilder(builderOptions);
      await builder.build('never');
    }
    msg = `\nBoilerplates written to ${builderOptions.outPath}.`
    console.log(msg);
  }
}

module.exports.BoilerplateBuilder = _BoilerplateBuilder;