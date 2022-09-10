import { MongoClient } from "mongodb";
import fs from "fs";
import dJSON from "dirty-json";

const MONGO_HOST = process.env.MONGO_HOST;

const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_PORT = process.env.MONGO_PORT;

const dbName = process.env.DBNAME;
const firstName = process.env.FIRSTNAME;
const secondName = process.env.SECONDNAME;
const thirdName = process.env.THIRDNAME;

const FIRST_FILE_PATH = process.env.FIRST_FILE_PATH;
const SECOND_FILE_PATH = process.env.SECOND_FILE_PATH;

MongoClient.connect(
  `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}`,
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
  const firstData = dJSON.parse(fs.readFileSync(FIRST_FILE_PATH));
  await first.insertMany(firstData);

  const second = await db.createCollection(secondName);
  const secondData = dJSON.parse(fs.readFileSync(SECOND_FILE_PATH));
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
