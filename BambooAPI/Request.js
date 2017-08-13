const request = require('request');

class Request {

    static get(options) {

        return new Promise((resolve, reject) => {

            request.get(options, (error, response) => {

                if (error) {

                    reject(error);
                }

                resolve(response);
            });
        });
    }
}

exports.Request = Request;
