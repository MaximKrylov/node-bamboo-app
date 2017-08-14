const _ = require('lodash');

const Bamboo = require('./BambooAPI/Bamboo').Bamboo;
const creds = require('./creds');

(async () => {

    let open = 'CLOUD';
    let uitests = 'UTOIC42';

    let bamboo = new Bamboo(creds['user'], creds['password']);

    let tests = await bamboo.getAllTests(bamboo, open, uitests, 31);

    console.log(tests.length);
})();
