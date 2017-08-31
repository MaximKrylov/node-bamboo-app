const _ = require('lodash');

class BambooResponseBodyMapper {

    static getJobs(responseBody) {

        let body = JSON.parse(responseBody);

        return _
            .map(body['searchResults'], BambooResponseBodyMapper._getJob);
    }

    static getTests(responseBody, params) {

        let body = JSON.parse(responseBody);

        return _
            .chain(body['testResults'][params.testsType]['testResult'])
            .map(BambooResponseBodyMapper._getTest)
            .value();
    }

    static getChanges(responseBody) {

        let body = JSON.parse(responseBody);

        return _
            .chain(body['changes']['change'])
            .map(BambooResponseBodyMapper._getCommit)
            .groupBy('author')
            .toPairs()
            .map(BambooResponseBodyMapper._getChange)
            .filter(change => change.features.length > 0)
            .value();
    }

    static getLatestBuildNumber(responseBody) {

        let body = JSON.parse(responseBody);
        return body['results']['result'][0]['number'];
    }

    static _getJob(responseJob) {

        return {
            key: responseJob['searchEntity']['key'],
            name: responseJob['searchEntity']['jobName']
        };
    }

    static _getCommit(responseCommit) {

        return {
            author: responseCommit['author'],
            files: _
                .map(responseCommit['files']['file'], 'name')
        };
    }

    static _getTest(responseTest) {

        return {
            feature: responseTest['className'],
            scenario: responseTest['methodName'],
            status: responseTest['status'],
            errorMessage: (responseTest['errors']['error'][0])
                ? BambooResponseBodyMapper._formatErrorMessage(responseTest['errors']['error'][0]['message'])
                : ''
        }
    }

    static _getChange(transformedResponseCommits) {

        return {
            author: transformedResponseCommits[0],
            features: _
                .chain(transformedResponseCommits[1])
                .map('files')
                .flatten()
                .uniq()
                .filter(file => _.endsWith(file, '.feature'))
                .map(BambooResponseBodyMapper._getFeatureSpecFlowPath)
                .value()
        };
    }

    static _formatErrorMessage(responseErrorMessage) {
        return responseErrorMessage
            .replace(/\r|\n/g, ' ')
            .replace(/ SCREENSHOT:.*$/, '')
            .replace(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g, '{sid}')
    }

    static _getFeatureSpecFlowPath(feature) {

        return _
            .chain(feature)
            .replace(/^Source[/]Wilco[.]UITest[/]/, '')
            .replace(/[.]feature$/, 'Feature')
            .replace(/[/]/g, '.')
            .value();
    }
}

exports.BambooResponseBodyMapper = BambooResponseBodyMapper;
