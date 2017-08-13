let Bamboo = require('./BambooAPI/Bamboo').Bamboo;
let creds = require('./creds');

(async () => {

    let open = 'CLOUD';
    let uitests = 'UTOIC42';

    let bamboo = new Bamboo(creds['user'], creds['password']);
    let changes = await bamboo.getJobs(open, uitests);

    console.log();
})();
