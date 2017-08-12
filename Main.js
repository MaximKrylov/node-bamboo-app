(async () => {

    let Bamboo = require('./Bamboo').Bamboo;
    let creds = require('./creds');

    let bamboo = new Bamboo(creds['user'], creds['password']);

    let changes = await bamboo.getChanges('CLOUD-UTOIC42', 3, 10);

    changes.forEach((change) => {
        console.log(change.author);

        change.features.forEach(function (feature) {
            console.log(feature);
        });

        console.log();
    });

    var jobs = await bamboo.getJobs('CLOUD-UTOIC42');

    jobs.forEach((job) => {
        console.log(job.name)
    });
})();