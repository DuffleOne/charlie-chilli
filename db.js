import ksuid from '@cuvva/ksuid';
import sqlite3 from 'sqlite3';

export default class DB {
	#db;

	constructor() {
		this.#db = new sqlite3.Database('./database.sqlite');
		this.#db.serialize(() => {
			this.#db.run(`
				CREATE TABLE IF NOT EXISTS data (
					id text PRIMARY KEY,
					timestamp TEXT NOT NULL,
					key TEXT NOT NULL,
					value TEXT NOT NULL
				) WITHOUT ROWID;
			`);
		});
	}

	// get the last X many records
	async list(limit) {
		return new Promise((resolve, reject) => {
			this.#db.all(`
				SELECT timestamp, key, value
				FROM data
				ORDER BY timestamp ASC
				LIMIT ?
			`, limit, (error, rows) => {
				if (error) return reject(error);
				resolve(rows);
			});
		});
	}

	// get a count of all records
	async count() {
		const result = await new Promise((resolve, reject) => {
			this.#db.get('SELECT COUNT(*) count FROM data', (error, row) => {
				if (error) return reject(error);
				resolve(row);
			});
		});

		return result?.count;
	}

	// record data into the database
	async record(timestamp, { temperature, humidity }) {
		const stmt = this.#db.prepare(`
			INSERT INTO data
			(id, timestamp, key, value)
			VALUES
			(?, ?, ?, ?);
		`);

		stmt.run(ksuid.generate('data').toString(), timestamp, 'temperature', temperature);
		stmt.run(ksuid.generate('data').toString(), timestamp, 'humidity', humidity);
		stmt.finalize();
	}
}
