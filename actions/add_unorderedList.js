// Copyright 2024 Joseph P Medley

'use strict';

const page = require('../page.js');
const utils = require('../utils.js');

async function _run(currentPage, question) {
  if (question.answer == question.default) { return; }
  let newContents = '';
  let answers = question.answer.split(',');
  for (let a in answers) {
    const tempPage = new page.Page('temporary', question.action.args[0], currentPage.sharedQuestions);
    tempPage.questions.answer('argument', answers[a]);
    await tempPage.askQuestions(`\nArgument ${answers[a]}:`);
    tempPage.render();
    newContents += tempPage.contents;
  }
  newContents = ("<ul>\n" + newContents + "</ul>");
  question.answer = newContents;
  utils.sendUserOutput((`-`.repeat(23)) + '\nFinished with the list.\n');
}

module.exports.run = _run;
