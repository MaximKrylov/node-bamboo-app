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

    async getChanges(plan, from, to) {

        let changes = [];

        for (let version = from; version <= (to || from); version++) {

            this.options.url = `${this.bambooUrl}/result/${plan}-${version}?expand=changes.change.files`
            changes.push(await this._get(BambooResponseBodyMapper.getChanges));
        }

        return _
            .chain(changes)
            .filter(change => change.length > 0)
            .flatten()
            .groupBy('author')
            .toPairs()
            .map(this._getChange)
            .value();
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

    _getChange(groupedChanges) {

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