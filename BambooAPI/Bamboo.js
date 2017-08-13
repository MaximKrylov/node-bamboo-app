const _ = require('lodash');

const Request = require('./Request').Request;
const BambooResponseBodyMapper = require('./BambooResponseBodyMapper').BambooResponseBodyMapper;

class Bamboo {

    constructor(user, password) {

        this.options = {
            url: '',
            headers: { 'Accept': 'Application/JSON' },
            auth: { user, password }
        };

        this.bambooUrl = 'https://www.intapp.com/bamboo/rest/api/latest';
    }

    async getChanges(projectKey, planKey, fromBuildNumber, toBuildNumber) {

        let changes = [];

        for (let buildNumber = fromBuildNumber; buildNumber <= (toBuildNumber || fromBuildNumber); buildNumber++) {

            this.options.url = `${this.bambooUrl}/result/${projectKey}-${planKey}-${buildNumber}?expand=changes.change.files`
            changes.push(await this._get(BambooResponseBodyMapper.getChanges));
        }

        return this._combineChanges(changes);
    }

    async getAllTests(projectKey, planKey, buildNumber) {

        let tests = [];

        let jobs = await this.getJobs(projectKey, planKey);

        for (let jobIndex in jobs) {

            let job = jobs[jobIndex];

            try {
                tests.push(await this.getJobAllTests(job, 'latest'));
                console.log(`${job.name} FINISHED`);
            } catch (e) {
                delete jobs[jobIndex];
                jobs = _.compact(jobs);
            }
        }

        return _
            .flatten(tests);
    }

    async getJobs(projectKey, planKey, maxResult) {

        this.options.url = `${this.bambooUrl}/search/jobs/${projectKey}-${planKey}?max-result=${maxResult || 10000}`;
        let jobs = await this._get(BambooResponseBodyMapper.getJobs);

        return jobs;
    }

    async getJobAllTests(job, buildNumber) {

        let existingSuccessfulTests = await this.getJobExistingSuccessfulTests(job, buildNumber);
        console.log(`   -> Getting existing successful tests...`);
        let fixedTests = await this.getJobFixedTests(job, buildNumber);
        console.log(`   -> Getting fixed tests...`);
        let existingFailedTests = await this.getJobExistingFailedTests(job, buildNumber);
        console.log(`   -> Getting existing failed tests...`);
        let newFailedTests = await this.getJobNewFailedTests(job, buildNumber);
        console.log(`   -> Getting failed tests...`);
        let skippedTests = await this.getJobSkippedTests(job, buildNumber);
        console.log(`   -> Getting skipped tests...`);
        let quarantinedTests = await this.getJobQuarantinedTests(job, buildNumber);
        console.log(`   -> Getting quarantined tests...`);

        return _
            .concat(existingSuccessfulTests, fixedTests, existingFailedTests, newFailedTests, skippedTests, quarantinedTests);
    }

    async getJobExistingSuccessfulTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.successfulTests.testResult.errors`
        let successfulTests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'successfulTests' });

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.fixedTests.testResult.errors`
        let fixedTests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'fixedTests' });

        let existingSuccessfulTests = _
            .xorWith(successfulTests, fixedTests, _.isEqual);

        return _
            .each(existingSuccessfulTests, (test) => {

                test.status = 'SUCCSESSFUL, EXISTING';
                test.job = job;
            });
    }

    async getJobFixedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.fixedTests.testResult.errors`
        let fixedTests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'fixedTests' });

        return _
            .each(fixedTests, (test) => {

                test.status = 'SUCCESSFUL, FIXED';
                test.job = job;
            });
    }

    async getJobExistingFailedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.existingFailedTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'existingFailedTests' });

        return _
            .each(tests, (test) => {

                test.status = 'FAILED, EXISTING';
                test.job = job;
            });
    }

    async getJobNewFailedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.newFailedTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'newFailedTests' });

        return _
            .each(tests, (test) => {

                test.status = 'FAILED, NEW';
                test.job = job;
            });
    }

    async getJobSkippedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.skippedTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'skippedTests' });

        return _
            .each(tests, (test) => {

                test.status = 'SKIPPED';
                test.job = job;
            });
    }

    async getJobQuarantinedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.quarantinedTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'quarantinedTests' });

        return _
            .each(tests, (test) => {

                test.status = 'QUARANTINED';
                test.job = job;
            })
    }

    _get(bodyMapperFunction, paramsObj) {

        return Request.get(this.options).then((response) => {

            return new Promise((resolve, reject) => {

                if (response.statusCode != 200) {

                    reject(new Error(response.statusMessage));
                }

                resolve(bodyMapperFunction(response.body, paramsObj));
            });
        });
    }

    _combineChanges(changes) {

        return _
            .chain(changes)
            .filter(change => change.length > 0)
            .flatten()
            .groupBy('author')
            .toPairs()
            .map(this._mapGroupedChanges)
            .value();
    }

    _mapGroupedChanges(groupedChanges) {

        return {
            author: groupedChanges[0],
            features: _
                .chain(groupedChanges[1])
                .map('features')
                .flatten()
                .uniq()
                .value()
        };
    }
}

exports.Bamboo = Bamboo;
