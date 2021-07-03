import { createRequire } from 'module';
import validator from 'is-my-json-valid';

const schemaDef = createRequire(import.meta.url)('./insert-data.json');
const validate = validator(schemaDef, { verbose: true });

export default function insertData(db) {
	return async (req, res) => {
		if (!validate(req.body)) {
			res.status(400).send(validate.errors);

			return;
		}

		const { temperature, humidity } = req.body;

		const now = new Date();

		await Promise.all([
			db.record(now.toISOString(), { key: 'temperature', value: temperature }),
			db.record(now.toISOString(), { key: 'humidity', value: humidity }),
		]);

		res.send(null);
	};
}
