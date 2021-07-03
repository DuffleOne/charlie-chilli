import ksuid from '@cuvva/ksuid';
import sqlite3 from 'sqlite3';

export default class DB {
	#db;

	constructor(source) {
		this.#db = new sqlite3.Database(source);
		this.#db.serialize(() => {
			this.#db.run(`
				CREATE TABLE IF NOT EXISTS data (
					id TEXT PRIMARY KEY,
					timestamp TEXT NOT NULL,
					key TEXT NOT NULL,
					value TEXT NOT NULL
				) WITHOUT ROWID;
			`);
			this.#db.run(`
				CREATE TABLE IF NOT EXISTS state (
					key TEXT PRIMARY KEY,
					value TEXT NOT NULL,
					updatedAt TEXT NOT NULL
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
				ORDER BY timestamp DESC
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
			this.#db.get(`
				SELECT COUNT(*) count
				FROM data`
			, (error, row) => {
				if (error) return reject(error);
				resolve(row);
			});
		});

		return result?.count;
	}

	// record data into the database
	async record(timestamp, { key, value }) {
		const stmt = this.#db.prepare(`
			INSERT INTO data
			(id, timestamp, key, value)
			VALUES
			(?, ?, ?, ?);
		`);

		return new Promise((resolve, reject) => {
			stmt.run(ksuid.generate('data').toString(), timestamp, key, value, error => {
				if (error) return reject(error);
				resolve();
			});
			stmt.finalize();
		});
	}

	async setState(timestamp, key, value) {
		const stmt = this.#db.prepare(`
			INSERT INTO state (key, value, updatedAt)
			VALUES ($key, $value, $timestamp)
			ON CONFLICT(key) DO UPDATE SET
				value = $value,
				updatedAt = $timestamp
		`);

		return new Promise((resolve, reject) => {
			stmt.run({
				$key: key,
				$value: value,
				$timestamp: timestamp,
			}, error => {
				if (error) return reject(error);
				resolve();
			});
			stmt.finalize();
		});
	}
}
