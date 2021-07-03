import DB from './db.js';
import Handlebars from 'handlebars';
import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';

const port = 8080;
const app = express();
const limit = 20;

const html = fs.readFileSync('./index.html', 'utf-8');
const template = Handlebars.compile(html);

const db = new DB('./database.sqlite');

app.use(bodyParser.json());

app.get('/', async (req, res) => {
	const [count, records] = await Promise.all([
		db.count(),
		db.list(limit),
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
		count,
		labels: JSON.stringify(labels),
		temperatureGraph: JSON.stringify(temperatureGraph),
		humidityGraph: JSON.stringify(humidityGraph),
	}));
});

app.post('/', (req, res) => {
	// TODO: validate input as right now, it'll accept literally anything
	const { temperature, humidity } = req.body;

	const now = new Date();

	db.record(now.toISOString(), { key: 'temperature', value: temperature });
	db.record(now.toISOString(), { key: 'humidity', value: humidity });

	res.send(null);
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

function convertToGraph(r) {
	return {
		x: r.timestamp,
		y: r.value,
	};
}
