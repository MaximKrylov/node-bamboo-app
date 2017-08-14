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
                tests.push(await this.getJobQuarantinedTests(job, buildNumber));
                tests.push(await this.getJobSkippedTests(job, buildNumber));
                tests.push(await this.getJobAllTests(job, buildNumber));
                console.log(`Getting tests from ${job.name}`);
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

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.allTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'allTests' });

        return _
            .each(tests, test => test.job = job);
    }

    async getJobSkippedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.skippedTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'skippedTests' });

        return _
            .each(tests, test => test.job = job);
    }

    async getJobQuarantinedTests(job, buildNumber) {

        this.options.url = `${this.bambooUrl}/result/${job.key}-${buildNumber}?expand=testResults.quarantinedTests.testResult.errors`
        let tests = await this._get(BambooResponseBodyMapper.getTests, { testsType: 'quarantinedTests' });

        return _
            .each(tests, test => test.job = job);
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
