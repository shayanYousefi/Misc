import {Db, MongoClient} from "mongodb";

let client: MongoClient | undefined;
let uri: string;

let db: Db;

if (process.env.MONGODB_USERNAME) {
    uri =
        `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/?authSource=${process.env.MONGODB_AUTH_DB}`;
} else {
    uri = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/`;
}

async function init() {
    if (client) {
        return client;
    } else {
        client = await MongoClient.connect(uri);
        db = client.db(process.env.MONGODB_MAIN_DB);
        return client;
    }
}

function getDatabase() {
    if (!client) {
        throw Error(`db client has not been initialized`)
    }
    return client.db(process.env.MONGODB_MAIN_DB);
}

async function disconnect() {
    if (!client) {
        return;
    }
    await client.close();
    client = undefined;
}


export {
    init,
    getDatabase,
    disconnect,
    db
}
