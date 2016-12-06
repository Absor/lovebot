const sqlite3 = require('sqlite3').verbose();


class Database {

  constructor(logger, filename) {
    this.logger = logger;
    this._db = new sqlite3.Database(filename);

    this._logQueries = this._logQueries.bind(this);

    this._db.on('trace', this._logQueries);
    this._db.on('profile', this._logQueries);
  }

  initialize() {
    this._db.run(`
      CREATE TABLE IF NOT EXISTS game
      (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner TEXT,
        end_at DATETIME
      )
    `);
    this._db.run(`
      CREATE TABLE IF NOT EXISTS record
      (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        record_json TEXT,
        FOREIGN KEY(game_id) REFERENCES artist(id) ON DELETE CASCADE
      )
    `);
  }

  saveGame(winner, record) {
    const logger = this.logger;
    const db = this._db;
    this._db.run(
      `
        INSERT INTO game
          (winner, end_at)
        VALUES
          (?, datetime())
      `,
      winner,
      function (err) {
        if (err) throw err;
        db.run(
          `
          INSERT INTO record
            (game_id, record_json)
          VALUES
            (?, ?)
          `,
          this.lastID,
          JSON.stringify(record)
        );
      }
    );
  }

  getWinners() {
    return new Promise((resolve, reject) => {
      this._db.all('SELECT winner FROM game', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows.map(row => row.winner));
      });
    });
  }

  _logQueries(query, timeMs) {
    const data = {
      query: query.replace( /\s\s+/g, ' '),
    };

    let when = 'start';

    if (timeMs !== undefined) {
      data.timeMs = timeMs;
      when = 'end';
    }

    this.logger.info(`SQL query ${when}`, data);
  }
}


module.exports = Database;
