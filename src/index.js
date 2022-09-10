import { MongoClient } from "mongodb";
import fs from "fs";
import dJSON from "dirty-json";

const dbHost = process.env.DBHOST || "localhost";

const dbName = "db_name";
const firstName = "first";
const secondName = "second";
const thirdName = "third";

MongoClient.connect(
  `mongodb://root:example@${dbHost}:27017`,
  async (err, client) => {
    if (err) {
      console.log("Connection error: ", err);
      throw err;
    }

    console.log("Connected");

    const db = await refillDB(client, dbName);

    await createThirdCollection(db);

    const res = await db.collection(thirdName).find().toArray();

    console.log(res);

    client.close();
  }
);

const refillDB = async (client, dbName) => {
  await client.db(dbName).dropDatabase();

  const db = client.db(dbName);

  const first = await db.createCollection(firstName);
  const firstData = dJSON.parse(fs.readFileSync("data/first.json"));
  await first.insertMany(firstData);

  const second = await db.createCollection(secondName);
  const secondData = dJSON.parse(fs.readFileSync("data/second.json"));
  await second.insertMany(secondData);
  return db;
};

const createThirdCollection = async (db) => {
  const pipline = [
    {
      $addFields: {
        longitude: {
          $first: "$location.ll",
        },
        latitude: {
          $last: "$location.ll",
        },
      },
    },
    {
      $lookup: {
        from: secondName,
        localField: "country",
        foreignField: "country",
        as: "output",
      },
    },
    {
      $addFields: {
        diffs: {
          $subtract: [
            {
              $sum: "$students.number",
            },
            {
              $getField: {
                field: "overallStudents",
                input: {
                  $first: "$output",
                },
              },
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$country",
        count: {
          $sum: 1,
        },
        longitude: {
          $push: "$longitude",
        },
        latitude: {
          $push: "$latitude",
        },
        allDiffs: {
          $push: "$diffs",
        },
      },
    },
    {
      $out: {
        db: dbName,
        coll: thirdName,
      },
    },
  ];

  await db.collection(firstName).aggregate(pipline).tryNext();
};
