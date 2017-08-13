(async () => {

    let Bamboo = require('./BambooAPI/Bamboo').Bamboo;
    let creds = require('./creds');

    let bamboo = new Bamboo(creds['user'], creds['password']);

    let changes = await bamboo.getChanges('CLOUD-UTOIC42', 3);

    changes.forEach((change) => {
        console.log(change.author);

        change.features.forEach(function (feature) {
            console.log(feature);
        });

        console.log();
    });
})();
