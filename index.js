const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');

const port = 8080;
const app = express();
const values = [];
const latestRecords = 10;

app.use(bodyParser.json());

app.get('/', (req, res) => {
	const html = fs.readFileSync('./index.html', 'utf-8');
	const template = Handlebars.compile(html);

	// TODO: load data from historical data source, such as SQLite

	const latest = values[values.length - 1];
	const count = values.length;

	const labels = [];
	const graphDataTemperature = [];
	const graphDataHumidity = [];

	for (const v of values) {
		labels.push(v.time);

		graphDataTemperature.push({
			x: v.time,
			y: v.temperature,
		});

		graphDataHumidity.push({
			x: v.time,
			y: v.humidity,
		});
	}

	res.send(template({
		...latest,
		count,
		graphDataTemperature: stringifyAndLimitData(graphDataTemperature),
		graphDataHumidity: stringifyAndLimitData(graphDataHumidity),
		labels: stringifyAndLimitData(labels),
	}));
});

function stringifyAndLimitData(array) {
	const set = array.slice(Math.max(array.length - latestRecords, 0))

	return JSON.stringify(set);
}

app.post('/', (req, res) => {
	const body = req.body;

	// TODO: save data to historical data source, such as SQLite
	// TODO: validate input as right now, it'll accept literally anything

	values.push({
		time: (new Date()).toISOString(),
		...body,
	})

	res.send(null);
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
