import DB from './db.js';
import Handlebars from 'handlebars';
import bodyParser from 'body-parser';
import { createRequire } from 'module';
import express from 'express';
import fs from 'fs';
import validator from 'is-my-json-valid';

const insertDataSchemaDef = createRequire(import.meta.url)('./insert-data.json');
const insertDataValidate = validator(insertDataSchemaDef, { verbose: true });

const setStateSchemaDef = createRequire(import.meta.url)('./set-state.json');
const setStateValidate = validator(setStateSchemaDef, { verbose: true });

const port = 8080;
const app = express();
const limit = 20;

// eslint-disable-next-line no-sync
const html = fs.readFileSync('./index.html', 'utf-8');
const template = Handlebars.compile(html);

const db = new DB('./database.sqlite');

app.use(bodyParser.json());

app.get('/', async (req, res) => {
	const [count, records, state] = await Promise.all([
		db.count(),
		db.list(limit),
		db.getState(),
	]);

	const temperatures = records.filter(r => r.key === 'temperature');
	const humidities = records.filter(r => r.key === 'humidity');

	const latest = {
		temperature: temperatures[0]?.value,
		humidity: humidities[0]?.value,
	};

	const labels = Array.from(new Set(records.map(r => r.timestamp))).reverse();
	const temperatureGraph = temperatures.map(convertToGraph);
	const humidityGraph = humidities.map(convertToGraph);

	res.send(template({
		latest,
		state,
		count,
		labels: JSON.stringify(labels),
		temperatureGraph: JSON.stringify(temperatureGraph),
		humidityGraph: JSON.stringify(humidityGraph),
	}));
});

app.post('/', async (req, res) => {
	if (!insertDataValidate(req.body)) {
		res.status(400).send(insertDataValidate.errors);

		return;
	}

	const { temperature, humidity } = req.body;

	const now = new Date();

	await Promise.all([
		db.record(now.toISOString(), { key: 'temperature', value: temperature }),
		db.record(now.toISOString(), { key: 'humidity', value: humidity }),
	]);

	res.send(null);
});

app.post('/state', async (req, res) => {
	if (!setStateValidate(req.body)) {
		res.status(400).send(setStateValidate.errors);

		return;
	}

	const { lights, fan } = req.body;
	const now = new Date();
	const set = [];

	if (lights !== void 0)
		set.push(db.setState(now.toISOString(), 'lights', lights ? 'ON' : 'OFF'));

	if (fan !== void 0)
		set.push(db.setState(now.toISOString(), 'fan', fan ? 'ON' : 'OFF'));

	await Promise.all(set);

	res.send(null);
});

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

function convertToGraph(r) {
	return {
		x: r.timestamp,
		y: r.value,
	};
}
