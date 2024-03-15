// Copyright 2024 Joseph P Medley

'use strict';

const page = require('../page.js');
const utils = require('../utils.js');

async function _run(currentPage, question) {
  const answer = question.answer;
  // We can assume answer has a '#' because it was
  //   validated before this was called.
  if (answer.startsWith('#')) { return; }
  let pieces = answer.split('#');
  question.answer = '#' + pieces[1];
  utils.sendUserOutput(question.answer);
}

module.exports.run = _run;
