import { MongoClient } from "mongodb";

const dbName = process.env.DBNAME || "localhost";

MongoClient.connect(`mongodb://${dbName}:27017`, (err, client) => {
  if (err) {
    console.log("Connection error: ", err);
    throw err;
  }

  console.log("Connected");

  client.close();
});
