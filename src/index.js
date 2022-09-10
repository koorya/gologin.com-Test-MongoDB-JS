import { MongoClient } from "mongodb";
import fs from "fs";
import dJSON from "dirty-json";

const dbName = process.env.DBNAME || "localhost";

MongoClient.connect(
  `mongodb://root:example@${dbName}:27017`,
  async (err, client) => {
    if (err) {
      console.log("Connection error: ", err);
      throw err;
    }

    console.log("Connected");

    await client.db("db_name").dropDatabase();

    const db = client.db("db_name");

    const companies = await db.createCollection("company");
    const firstData = dJSON.parse(fs.readFileSync("data/first.json"));
    await companies.insertMany(firstData);

    const queryParams = await db.createCollection("query_params");
    const secondData = dJSON.parse(fs.readFileSync("data/second.json"));
    await queryParams.insertMany(secondData);

    client.close();
  }
);
