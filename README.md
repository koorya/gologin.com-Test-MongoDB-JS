# gologin.com | Test MongoDB + JS

1. Create an .env in the root of the project and populate it as .env.example;
2. run `docker-compose up` to start the local mongodb if needed;
3. type `npm start` to start the aplication, the generated collection will be displayed in the console;
4. now mongodb contains three collection: two from json and the third generated;
5. `docker-compose down` if needed;

## Be careful

The application will delete the existing database and create a new one.
