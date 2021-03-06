'use strict';

const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const prompts = require('./prompts');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const utils = require('../../utils/all');

const baseRootPath = path.join(__dirname + '/templates');

module.exports = class extends Generator {
    constructor(args, options) {
        super(args, options);

        this.option('skip-welcome-message', {
            desc: 'Skip the welcome message',
            type: Boolean,
            defaults: false
        });

        this.option('skip-install');

        this.sourceRoot(baseRootPath);

        this.config.save();
    }

    prompting() {
        this.log(yosay('Welcome to the outstanding ' + chalk.red('generator-react-complete') + ' generator!'));

        return this.prompt(prompts)
        .then(answers => {
            // Make sure to get the correct app name if it is not the default
            if(answers.appName !== utils.yeoman.getAppName()) {
                answers.appName = utils.yeoman.getAppName(answers.appName);
            }

            // Set needed global vars for yo
            this.appName = answers.appName;
            this.appType = answers.appType;
            this.language = answers.language;
            this.framework = answers.framework;
            this.serverframework = answers.serverframework;
            this.compiler = answers.compiler;
            this.bundler = answers.bundler;
            this.transpiler = answers.transpiler;

            // Set needed keys into config
            this.config.set('appName', this.appName);
        });
    }

    writeBundlerConfig() {
        let bundlerConfig = utils.config.getChoiceByKey('bundler', this.bundler);
        let languageConfig = utils.config.getChoiceByKey('language', this.language);
        let frameworkConfig = utils.config.getChoiceByKey('framework', this.framework);
        let appTypeConfig = utils.config.getChoiceByKey('appType', this.appType);

        if (bundlerConfig.files) {
            const files = bundlerConfig.files['common'].concat(bundlerConfig.files[this.appType]);
            files.map(file => {
                this.fs.copyTpl(
                    this.templatePath(utils.internal.getSourceWebpackConfigFileName(file, languageConfig)),
                    this.destinationPath(file.destination),
                    {
                        entryPoint: utils.internal.getEntryPoinWebpackConfigFileName(frameworkConfig, languageConfig),
                        appName: this.appName
                    }
                );
            });
        }
    }

    writeTranspilerConfig() {
        let transpilerConfig = utils.config.getChoiceByKey('transpiler', [this.language, this.transpiler]);

        this.fs.copyTpl(
            this.templatePath('transpiler/' + transpilerConfig.config),
            this.destinationPath(transpilerConfig.config),
            {
                compilerTarget: this.compiler
            }
        );
    }

    writeClient() {
        let compilerConfig = utils.config.getChoiceByKey('compiler', [this.language, this.compiler]);
        let languageConfig = utils.config.getChoiceByKey('language', this.language);
        let frameworkConfig = utils.config.getChoiceByKey('framework', this.framework);

        frameworkConfig.files[languageConfig.name].map(file => {
            this.fs.copy(
                this.templatePath(utils.internal.getSourceDraftFileName(file, compilerConfig, languageConfig, frameworkConfig)),
                this.destinationPath(utils.internal.getTargetDraftFileName(file, compilerConfig, languageConfig, frameworkConfig))
            );
        });
    }

    writeServer() {
        if (this.serverframework) {
            let serverFrameworkConfig = utils.config.getChoiceByKey('serverframework', this.serverframework);

            serverFrameworkConfig.files['common'].map(file => {
                this.fs.copy(
                    this.templatePath(file.source),
                    this.destinationPath(file.destination)
                );
            });
        }
    }

    writePackageJson() {
        let bundlerConfig = utils.config.getChoiceByKey('bundler', this.bundler);
        let transpilerConfig = utils.config.getChoiceByKey('transpiler', [this.language, this.transpiler]);
        let frameworkConfig = utils.config.getChoiceByKey('framework', this.framework);
        let serverFrameworkConfig = this.serverframework ? utils.config.getChoiceByKey('serverframework', this.serverframework) : undefined;

        const dependencies = _.assign({},
            utils.internal.getDependencies(bundlerConfig.dependencies, this.language),
            utils.internal.getDependencies(transpilerConfig.dependencies, this.language),
            utils.internal.getDependencies(frameworkConfig.dependencies, this.language),
            serverFrameworkConfig ? utils.internal.getDependencies(serverFrameworkConfig.dependencies, this.language) : {}
        );

        const devDependencies = _.assign({},
            utils.internal.getDependencies(bundlerConfig.devDependencies, this.language),
            utils.internal.getDependencies(transpilerConfig.devDependencies, this.language),
            utils.internal.getDependencies(frameworkConfig.devDependencies, this.language)
        );

        const scripts = _.assign({
                "build:dev": "webpack --config webpack.dev.config --progress --colors",
                "build": "webpack --config webpack.prod.config --progress --colors"
            },
            serverFrameworkConfig ? utils.internal.getScripts(serverFrameworkConfig.scripts) : {}
        );

        this.fs.copyTpl(
            this.templatePath('_package.json'),
            this.destinationPath('package.json'),
            {
                appName: this.appName,
                dependencies: JSON.stringify(dependencies, null, '\t\t').replace('}', '\t}'),
                devDependencies: JSON.stringify(devDependencies, null, '\t\t').replace('}', '\t}'),
                scripts: JSON.stringify(scripts, null, '\t\t').replace('}', '\t}')
            }
        );
    }

    writing() {
        this.writeBundlerConfig();
        this.writeTranspilerConfig();
        this.writeClient();
        this.writeServer();
        this.writePackageJson();

        this.fs.copy(this.templatePath('public'), this.destinationPath('public'));
    }

    install() {
        this.installDependencies({ bower: false });
    }
};
