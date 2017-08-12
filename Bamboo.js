const _ = require('lodash');

const Request = require('./request').Request;
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

    async getJobs(plan, maxResult) {

        this.options.url = `${this.bambooUrl}/search/jobs/${plan}?max-result=${maxResult || 1000}`;
        let jobs = await this._get(BambooResponseBodyMapper.getJobs);

        return jobs;
    }

    async getChanges(plan, fromVersion, toVersion) {

        let changes = [];

        for (let version = fromVersion; version <= (toVersion || fromVersion); version++) {

            this.options.url = `${this.bambooUrl}/result/${plan}-${version}?expand=changes.change.files`
            changes.push(await this._get(BambooResponseBodyMapper.getChanges));
        }
        
        return this._combineChanges(changes);
    }

    async getSuccessfulTests(jobId, version) {
        this.options.url = `${this.bambooUrl}/result/${jobId}-${version}?expand=testResults.successfulTests.testResult.errors`
    }

    async getFixedTests(jobId, version) {
        this.options.url = `${this.bambooUrl}/result/${jobId}-${version}?expand=testResults.fixedTests.testResult.errors`
    }

    async getExistingFailedTests(jobId, version) {
        this.options.url = `${this.bambooUrl}/result/${jobId}-${version}?expand=testResults.existingFailedTests.testResult.errors`
    }

    async getNewFailedTests(jobId, version) {
        this.options.url = `${this.bambooUrl}/result/${jobId}-${version}?expand=testResults.newFailedTests.testResult.errors`
    }

    async getSkippedTests(jobId, version) {
        this.options.url = `${this.bambooUrl}/result/${jobId}-${version}?expand=testResults.skippedTests.testResult.errors`
    }

    async getQuarantinedTests(jobId, version) {
        this.options.url = `${this.bambooUrl}/result/${jobId}-${version}?expand=testResults.quarantinedTests.testResult.errors`
    }

    _get(bodyMapperFunction) {

        return Request.get(this.options).then((response) => {

            return new Promise((resolve, reject) => {

                if (response.statusCode != 200) {

                    reject(new Error(response.statusMessage));
                }

                resolve(bodyMapperFunction(response.body));
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