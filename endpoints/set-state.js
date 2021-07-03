import { createRequire } from 'module';
import validator from 'is-my-json-valid';

const schemaDef = createRequire(import.meta.url)('./set-state.json');
const validate = validator(schemaDef, { verbose: true });

export default function setState(db) {
	return async (req, res) => {
		if (!validate(req.body)) {
			res.status(400).send(validate.errors);

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
	};
}
