const _ = require('lodash');
const fs = require('async-file');

const bambooCreds = require('./bamboo-creds');
const Bamboo = require('./BambooAPI/Bamboo').Bamboo;

const project = "CLOUD"; // Open
const plan = "UTOIC414"; // UTOIC42 - uitests, UTOIC414 - uitests IE
const build = "2";

(async () => {
    const bamboo = new Bamboo(bambooCreds['user'], bambooCreds['password']);
    let tests = await bamboo.getAllTests(project, plan, build);

    let results = "";
    let errors = "";

    _.chain(tests)
        .filter((test) => {
            if (test.status === 'failed') {
                results += `${test.status}\t${test.job.name}\t${test.feature} ${test.scenario}\t${test.errorMessage}\n`;
                return test;
            }
        })
        .groupBy('errorMessage')
        .toPairs()
        .forEach((element) => {
            errors += `${element[0]}\t${element[1].length}\n`;
        })
        .value();

    await fs.writeFile("./results.txt", results, 'binary');
    await fs.writeFile("./errors.txt", errors, 'binary');
})();
