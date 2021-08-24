const {MongoClient} = require("mongodb");
const config = require('./config.json');
const axios = require('axios');
const ProgressBar = require('progress');

const db_name = config.db.db_name;
const collection_name = config.db.collection;
let uri;
if (config.db.username) {
    uri = `mongodb://${config.db.username}:${config.db.password}@${config.db.ip}:${config.db.port}/${config.db.authDB ? config.db.authDB : ""}`;
} else {
    uri = `mongodb://${config.db.ip}:${config.db.port}/${config.db.authDB ? config.db.authDB : ""}`;
}


const client = new MongoClient(uri);


async function run() {
    try {

        await client.connect();
        await client.db("admin").command({ping: 1});
        console.log("Connected successfully to server");

        await updateFinishedAt();

        await sendReportRequest();


    } finally {
        await client.close();
    }
}

async function updateFinishedAt() {

    let finishCursor = client.db(db_name).collection(collection_name).aggregate([
        {
            $match: {
                exam_id: "610e88c167a9312bc560e722",
            },
        },
        {
            $set: {
                exam_user_id: {
                    $toString: "$_id",
                },
            },
        },
        {
            $lookup: {
                from: "temp_exams",
                let: {
                    exam_user_id: "$exam_user_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$$exam_user_id", "$exam_user_id"],
                            },
                        },
                    },
                    {
                        $sort:
                            {exam_user_id: 1, question_id: 1, selected_at: -1, created_at: -1},
                    },
                    {
                        $group:
                            {
                                _id: {
                                    exam_user_id: '$exam_user_id',
                                    question_id: "$question_id",
                                },
                                group: {$first: '$$ROOT'},
                            },
                    },
                    {$replaceRoot: {newRoot: "$group"}},
                    {
                        $match: {
                            choice_id: {$ne: null},
                        },
                    },
                ],
                as: "temp_data",
            },
        },
        {
            $unwind: { path: "$temp_data", preserveNullAndEmptyArrays: true }
        },
        {
            $group: {
                _id: "$_id",
                count: {
                    $sum: 1,
                },
            },
        },
    ]);

    let finishBatch = client.db(db_name).collection("exam_user").initializeUnorderedBulkOp();

    let updateBar = new ProgressBar('updating finished_at: [:bar] :spinner | step :current of :total | :status ', {
        total: 3,
        width: 40,
    });
    let spinnerBar = spinner(updateBar);
    updateBar.render({status: 'creating cursor', spinner: '-'});

    updateBar.tick(1, {
        status: 'retrieving exam_users data from db',
        spinner: "\\",
    });
    let count = 0;
    let needUpdate = 0;
    while (await finishCursor.hasNext()) {
        let doc = await finishCursor.next();
        if (doc.count === 90) {
            finishBatch
                .find({_id: doc._id})
                .updateOne({
                    $set: {
                        finished_at: new Date(),
                    },
                });
            needUpdate++;
        } else {
            finishBatch
                .find({_id: doc._id})
                .updateOne({
                    $set: {
                        finished_at: null,
                    },
                });
        }
        count++;
    }
    updateBar.tick(1, {
        status: "updating exam-user's finished_at in db",
        spinner: '\\',
    });
    let result = await finishBatch.execute();
    clearInterval(spinnerBar);
    updateBar.tick(1, {
        status: `done`,
        spinner: '',
    });
    console.log(`Of ${count} exam-user found in db, ${needUpdate} exam-users finished their exam. finished_at of ${result.result.nModified} exam-users updated`);
}

async function sendReportRequest() {
    let cursor = client.db(db_name).collection(collection_name)
        .find({
            exam_id: "610e88c167a9312bc560e722",
            finished_at:{
            	$ne:null
            }
        });


    let count = 0;
    let done = 0;
    let error = 0;
    let requests = [];


    while (await cursor.hasNext()) {
        let doc = await cursor.next();

        requests.push(`http://${config.server.ip}:${config.server.port}/psychometric/exam-user/${doc._id.toString()}`);
        count++;

    }

    let bar = new ProgressBar(
        'sending report requests: [:bar] :spinner | successful::done, failed::error  total::total | :status', {
            total: requests.length,
            width: 40,
        });
    let spinnerBar = spinner(bar);
    let chunk_size = 1000;
    let chunk_number = 1;
    let last_index = requests.length;
    for (let j = requests.length; j >= 0; j--) {
        if (j % chunk_size === 0) {
            bar.render({
                status: `processing chunk ${chunk_number} of ${Math.ceil(requests.length / chunk_size)} (maximum chunk size ${chunk_size})`,
                spinner: '-',
                done: done,
                error: error,
            });

            let chunkResult = await Promise.allSettled(requests.slice(j, last_index).map(sendRequest));

            chunkResult.forEach(el => {
                if (el.status === "fulfilled") {
                    done++;
                } else {
                    error++;
                }
            });

            bar.tick(last_index - j, {
                ...bar.tokens,
                status: j===0 ? 'done' : `chunk ${chunk_number} processed`,
                done: done,
                error: error,
            });
            chunk_number++;
            last_index = j;
        }
    }
    clearInterval(spinnerBar);
    //uncomment code below to persist changes to database

    // if (bulk.length) {
    // 	let result = await bulk.execute();
    // 	console.log('result', result)
    // }

}

async function sendRequest(url) {
    return axios.get(url);
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
