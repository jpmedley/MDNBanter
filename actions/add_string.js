// Copyright 2024 Joseph P Medley

'use strict';

function _run(currentPage, question) {
  if (!question.answer) {
    question.answer = '';
    return;
  }
  question.answer = question.action.args[0];
}

module.exports.run = _run;
