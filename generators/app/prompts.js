
'use strict';

const utils = require('../../utils/all');
const _ = require('lodash');

module.exports = [
  {
    type: 'input',
    name: 'appName',
    message: 'Please choose your application name',
    default: utils.yeoman.getAppName()
  },
  {
    type: 'list',
    name: 'language',
    message: 'Which langage do you want to use?',
    choices: utils.config.getChoices('language'),
    default: utils.config.getDefaultChoice('language')
  },
  {
    type: 'list',
    name: 'transpiler',
    message: 'Which transpiler do you want to use?',
    choices: response => _.find(utils.config.getChoices('transpiler'), x => x.name === response.language).values,
    default: utils.config.getDefaultChoice('transpiler')
  },
  {
    type: 'list',
    name: 'compiler',
    message: 'Which compiler do you want to use?',
    choices: response => _.find(utils.config.getChoices('compiler'), x => x.name === response.language).values,
    default: utils.config.getDefaultChoice('compiler')
  },
  {
    type: 'list',
    name: 'framework',
    message: 'Which framework do you want to use?',
    choices: utils.config.getChoices('framework'),
    default: utils.config.getDefaultChoice('framework')
  },
  {
    type: 'list',
    name: 'bundler',
    message: 'Which bundler do you want to use?',
    choices: utils.config.getChoices('bundler'),
    default: utils.config.getDefaultChoice('bundler')
  }
];
