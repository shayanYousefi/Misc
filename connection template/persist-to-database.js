const { MongoClient } = require("mongodb");
const config = require('./config.json');

const db_name = config.db.db_name;
const collection_name = config.db.collection;
let uri;
if(config.db.username){
	uri = `mongodb://${config.db.username}:${config.db.password}@${config.db.ip}:${config.db.port}/${db_name}`;
}else{
	uri = `mongodb://${config.db.ip}:${config.db.port}/${db_name}`;
}


const client = new MongoClient(uri);


async function run() {
	try {
		await client.connect();
		await client.db("admin").command({ ping: 1 });
		console.log("Connected successfully to server");

		let questionCursor = client.db(db_name).collection(collection_name)
			.find({
				//write fields used to get data. leave blank to get all
				//example:
				// _id: ObjectId("5ffdd0d35590063ba07fad39")
			})

		let bulk = client.db(db_name).collection(collection_name).initializeUnorderedBulkOp();

		while (await questionCursor.hasNext()) {

			//the document
			let doc = await questionCursor.next();
			console.log(doc);

			//change fields of document (doc) that needs updating


			bulk
				.find({
					_id: doc._id,
				})
				.updateOne({
					$set: {
						//write fields of document that needs updating in json format
						//example:
						//statement: doc.statement
					}
				})
		}

		//uncomment code below to persist changes to database

		// if (bulk.length) {
		// 	let result = await bulk.execute();
		// 	console.log('result', result)
		// }


	} finally {
		await client.close();
	}
}

run().catch(console.dir);
