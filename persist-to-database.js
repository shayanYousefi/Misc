const {MongoClient} = require("mongodb");
const config = require('./config.json');
const fs = require('fs/promises');
const ProgressBar = require('progress');

const db_name = config.db.db_name;
const collection_name = config.db.collection;
let uri;
if (config.db.username) {
    uri = `mongodb://${config.db.username}:${config.db.password}@${config.db.ip}:${config.db.port}/${config.db.authDB}`;
} else {
    uri = `mongodb://${config.db.ip}:${config.db.port}/${config.db.authDB}`;
}


const client = new MongoClient(uri, {
    connectTimeoutMS: 21474836,
});


async function run() {
    try {


        await client.connect();
        await client.db("admin").command({ping: 1});
        console.log("Connected successfully to server");

        let progress = new ProgressBar('progress: :spinner | :processed documents changed | :status ', {
            total: 1,
            width: 40,
        });
        // progress.render = function (tokens, force) {
        //     readLine.clearLine(process.stdout);
        //     readLine.cursorTo(process.stdout, 0);
        //     this.render(tokens, force);
        // };
        let spin = spinner(progress);
        progress.render({
            ...progress.tokens,
            status: "reading document from db",
            processed: 0,
        });

        let file = await fs.open('./file.txt', "w+");


        let questionCursor = client.db(db_name).collection(collection_name)
            .find({});
        let bulk = client.db(db_name).collection(collection_name).initializeUnorderedBulkOp();

        let i = 0;
        let total = 0;
        while (await questionCursor.hasNext()) {
            //the document
            let doc = await questionCursor.next();
            total++;
            //change fields of document (doc) that needs updating

            let found = false;
            let output = {};
            let changed = {};
            for (const docKey in doc) {
                if (doc.hasOwnProperty(docKey)) {
                    if (/.*forum\.sanatisharif\.ir.*/.test(doc[docKey]) && doc._key !== "errors:404") {
                        changed[docKey] = doc[docKey].replace(/forum\.sanatisharif\.ir/g, 'forum.alaatv.com');
                        output[docKey] = doc[docKey];
                        output[docKey + "changed"] = changed[docKey];
                        found = true;
                        i++;
                    }
                }
            }


            if (total % 1000 === 0) {
                progress.render({
                    ...progress.tokens,
                    status: `${i} found from ${total} searched`,
                });
            }

            if (!found) {
                continue;
            }

            bulk
                .find({
                    _id: doc._id,
                })
                .updateOne({
                    $set: changed,
                });
            if (bulk.length > 500) {
                bulk.execute().then(result => {
                    progress.render({
                        ...progress.tokens,
                        processed: progress.tokens.processed + result.result?.nModified,
                        status: `${i} found from ${total} searched`,
                    });
                });
                bulk = client.db(db_name).collection(collection_name).initializeUnorderedBulkOp();
            }
            output._id = doc._id;
            output._key = doc._key;
            await file.appendFile(JSON.stringify(output, null, '  '));

        }
        if (bulk.length) {
            let result = await bulk.execute();
            progress.render({
                ...progress.tokens,
                processed: progress.tokens.processed + result.result.nModified,
                status: `${i} found from ${total} searched`,
            });
        }

        clearInterval(spin);
        progress.tick(1, {
            ...progress.tokens,
            status: `${i} document needed modifying from a total of ${total} document`,
        });

        //uncomment code below to persist changes to database

        // if (bulk.length) {
        // 	let result = await bulk.execute();
        // 	console.log('result', result)
        // }


    } finally {
        await client.close();
    }
}

function spinner(bar) {
    let index = 0;
    let stages = ['\\', '|', '/', "-"];

    return setInterval(() => {
        bar.render({
            ...bar.tokens,
            spinner: stages[index],
        });
        index = index === 3 ? 0 : index + 1;
    }, 1000);
}

run().catch(console.dir);
