const _ = require('lodash');

class BambooResponseBodyMapper {

    static getJobs(responseBody) {

        let body = JSON.parse(responseBody);

        return _
            .map(body['searchResults'], BambooResponseBodyMapper._getJob);
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

    static _getJob(responseJob) {

        return {
            id: responseJob['id'],
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

    static _getChange(transformedResponseCommits) {

        return {
            author: transformedResponseCommits[0],
            features: _
                .chain(transformedResponseCommits[1])
                .map('files')
                .flatten()
                .uniq()
                .filter(file => _.endsWith(file, '.feature'))
                .value()
        };
    }
}

exports.BambooResponseBodyMapper = BambooResponseBodyMapper;