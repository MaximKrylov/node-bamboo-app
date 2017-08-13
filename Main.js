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

    let existingFailedTests = await bamboo.getExistingFailedTests('CLOUD-UTOIC42-TF', 10);
    let newFailedTests = await bamboo.getNewFailedTests('CLOUD-UTOIC42-TF', 10);
    let skippedTests = await bamboo.getSkippedTests('CLOUD-UTOIC42-TF', 10);
    let quarantinedTests = await bamboo.getQuarantinedTests('CLOUD-UTOIC42-TF', 10);

    let successfulTests = await bamboo.getExistingSuccessfulTests('CLOUD-UTOIC42-TPRIS', 31);
    let fixedTests = await bamboo.getFixedTests('CLOUD-UTOIC42-TPRIS', 31);

    console.log();
})();
