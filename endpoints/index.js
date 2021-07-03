import Handlebars from 'handlebars';
import fs from 'fs';

// eslint-disable-next-line no-sync
const html = fs.readFileSync('./index.html', 'utf-8');
const template = Handlebars.compile(html);

const limit = 20;

export default function index(db) {
	return async (req, res) => {
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
	};
}

function convertToGraph(r) {
	return {
		x: r.timestamp,
		y: r.value,
	};
}
