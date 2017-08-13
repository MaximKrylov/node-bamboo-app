let Bamboo = require('./BambooAPI/Bamboo').Bamboo;
let creds = require('./creds');

(async () => {

    let open = 'CLOUD';
    let uitests = 'UTOIC42';

    let bamboo = new Bamboo(creds['user'], creds['password']);

    let jobs = await bamboo.getJobs(open, uitests);
    let tests = await bamboo.getAllTests(open, uitests, 'latest');

    console.log(tests.length);
})();
