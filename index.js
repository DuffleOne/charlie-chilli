import DB from './db.js';
import bodyParser from 'body-parser';
import express from 'express';
import index from './endpoints/index.js';
import insertData from './endpoints/insert-data.js';
import setState from './endpoints/set-state.js';

const port = 8080;
const app = express();

const db = new DB('./database.sqlite');

app.use(bodyParser.json());

app.get('/', index(db));
app.post('/', insertData(db));
app.post('/state', setState(db));

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
