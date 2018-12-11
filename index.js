const extend = require('tru_extend');
const sqlite3 = require('sqlite3');
const log = require('tru_log');
const fs = require('fs');

module.exports =  function(_options) {
	
	const _defauts = {
		dbPath: 'database.sqlite',
		dbClose: true,
		log: false,
		showSql: false,
		verbose: true // TODO
	};
	
	const _param = extend(_defauts, _options);
	
	const _sqlite3 = sqlite3.verbose();
	
	const _useDatabase = options => {
		const defauts = {
			dbPath: _param.dbPath,
			log: _param.log,
			onSuccess: (db, dbPath) => {},
			onError: log
		};
		
		const param = extend(defauts, options);
		
		if(typeof param.dbPath === 'undefined') {
			return param.onError('SqliteDatabase.createTable(): options.dbPath is undefined');
		}
		
		_dbPath = __dirname+'/../../'+param.dbPath;
		param.onSuccess(new _sqlite3.Database(_dbPath), _dbPath);
	};
	
	return {
		useDatabase: _useDatabase,
		createDatabase: options => {
			_useDatabase({
				dbPath: _param.dbPath,
				log: _param.log,
				onSuccess: db => {
					db.close();
					if(options.onSuccess) return options.onSuccess();
				},
				onError: options.onError
			});
		},
		tableList: options => {
			
			const defauts = {
				dbPath: _param.dbPath,
				log: _param.log,
				showSql: _param.showSql,
				dbClose: _param.dbClose,
				onSuccess: tables => {
					log.notice('TABLES', tables);
				},
				onError: err => {
					log.error('ERR', err);
				}
			};
			
			const param = extend(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				log: param.log,
				onSuccess: (db, dbPath) => {
					
					db.all('SELECT * FROM sqlite_master', (err, tables) => {
						
						if(param.dbClose) db.close();
						
						if(err) return param.onError.fail(err);
						
						param.onSuccess(tables);
					});
				},
				onError: param.onError
			});
		},
		tableInfo: options => {
			
			var defauts = {
				dbPath: _param.dbPath,
				showSql: _param.sql,
				log: _param.log,
				table: null,
				onSuccess: cols => {
					log.notice('COLS', cols);
				},
				onError: err => {
					log.error('ERR', err);
				}
			};
			
            var param = extend(defauts, options);
            
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: (db, dbPath) => {
                    
					db.all('pragma table_info('+param.table+')', (err, cols) => {
						
						db.close();
						
						if(err) return param.onError(err);
						
						param.onSuccess(cols);
					});
				},
				onError: param.onError
			});
		},
		createTable: options => {
			
			const defauts = {
				log: _param.log,
				showSql: _param.showSql,
				dbPath: _param.dbPath,
				dbClose: _param.dbClose,
				name: null,
				schema: [
					{key: 'id'}
				],
				onSuccess: () => {},
				onError: err => {}
			};
			
			const param = extend(defauts, options);

			if(typeof param.name === 'undefined') {
				return param.onError('SqliteDatabase.createTable(): options.name is undefined');
			}
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: db => {
					
					let definitionTable = '';
					
					for(let i = 0, j = param.schema.length; i < j ; i++) {
						
						if(param.schema[i].key.toLowerCase() === 'id') {
							definitionTable += 'id INTEGER PRIMARY KEY AUTOINCREMENT';
						}
						else {
							definitionTable += param.schema[i].key+' '+param.schema[i].type;
						}

						if(param.schema[i].pk) {
							definitionTable += ' PRIMARY KEY';
						}
						if(!param.schema[i].null) {
							definitionTable += ' NOT NULL';
						}
						if(param.schema[i].unique) {
							definitionTable += ' UNIQUE';
						}
						
						if(i < j-1) {
							definitionTable += ', ';
						}
					}

					for(let i = 0, j = param.schema.length; i < j ; i++) {
						if(param.schema[i].fk) {
							const split = param.schema[i].fk.split('.');
							definitionTable += ', FOREIGN KEY('+split[0]+') REFERENCES '+split[0]+'('+split[1]+')';
						}
					}
					
					let sql = 'CREATE TABLE '+param.name+' ('+definitionTable+')';
					if(param.showSql) log.notice('SqliteDatabase.createTable(): SQL: '+sql);
					
					db.run(sql, err => {
						if(err) return param.onError(err);
						// if(param.log) log.notice('DEFINITION TABLE ('+param.dbPath+'/'+param.name+'): '+definitionTable)
						if(param.dbClose || !!!param.values.length) db.close();
						if(param.log) log.success('tru_sqlite.createTable(): table "'+param.name+'" créée');

						if(param.values) {

							let sql = 'INSERT INTO '+param.name+' (';

							for(let i = 0, j = param.schema.length; i < j; i++) {
								if(param.schema[i].key != 'id') {
									sql += param.schema[i].key
									if(i < j -1) {
										sql += ', ';
									}
								}
							}

							sql += ') VALUES ';

							for(let i = 0, j = param.values.length; i < j ; i++) {
								
								sql += '('

								for(let k = 0, l = param.schema.length; k < l; k++) {
									if(param.schema[k].key != 'id') {
										sql += '"'+param.values[i][param.schema[k].key]+'"'
										if(k < l -1) {
											sql += ', ';
										}
									}
								}

								sql += ')';
								if(i < j -1) {
									sql += ', ';
								}
							}

							// if(param.showSql) {
							// 	log.warn('SQL: '+sql);
							// }

							module.exports().query({
								log: param.log,	
								showSql: param.showSql,	
								dbPath: param.dbPath,
								sql: sql,
								// args: {},
								onSuccess: data => {
									param.onSuccess('tru_sqlite.createTable(): table "'+param.name+'" créée');
									// db.close();
								},
								onError: err => {
									console.log('FAILED BOUFFON')
								}
							});
						}

						// TODO last callback
						

							// db.close();
					});
				},
				onError: param.onError
			});
		},
		deleteDatabase: options => {

			const defauts = {
				log: _param.log,
				dbPath: _param.dbPath,
				name: 'newTable',
				cols: [
					{key: 'id', type: 'INT'}
				],
				onSuccess: () => {},
				onError: err => {}
			};
			
			const param = extend(defauts, options);

			fs.unlink(param.dbPath, err => {
				if(err) {
					if(err.errno == -4058) {
						if(param.log) log.warn('tru_sqlite.deleteDatabase(): database "'+param.dbPath+'" doesn\'t seems to exists');
						return param.onSuccess();
					}
					if(err.errno == -4082) {
						if(param.log) log.error('tru_sqlite.deleteDatabase(): database "'+param.dbPath+'" is busy or locked');
						return param.onError(err);
					}
					return param.onError(err);
				}
				if(param.log) log.success('tru_sqlite.deleteDatabase(): database"'+param.dbPath+'" deleted');
				param.onSuccess();
			});
		},
		inserts: options => {
			// TODO inserer un lot
		},
		insert: options => {
			// pour tests unitaires
			return this.query(options);
		},
		select: options => {
			// pour tests unitaires
			return this.query(options);
		},
		update: options => {
			// pour tests unitaires
			return this.query(options);
		},
		delete: options => {
			// pour tests unitaires
			return this.query(options);
		},
		query: options => { // options: sql, args, onSuccess, onError et log
			
			const defauts = {
				log: false,
				dbPath: _param.dbPath,
				showSql: _param.showSql,
				sql: _param.sql,
				args: {},
				onSuccess: data => {},
				onError: err => {}
			};
			
			const param = extend(defauts, options);

			if(typeof param.sql === 'undefined') return log.error('tru_sqlite.query(): options.sql undefined');
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: db => {
					
					param.sql = param.sql.replace(/:/g, '$');
					for(let key in param.args) {
						param.args['$'+key] = param.args[key];
						delete param.args[key];
					}
					
					if(param.showSql) {
						log.notice('SQL: '+param.sql);
					}
					
					if(param.sql.split(' ')[0].toUpperCase() === 'SELECT') {
						
						db.all(param.sql, param.args, (err, rows) => {
							
							db.close();
							if(err) {
								if(param.log) log.error('SQL FAIL: '+err);
								return param.onError(err)
							}
							
							if(param.log) log.success('SQL RESULTS: ', rows);
							return param.onSuccess(rows);
						});
					}
					else {
						db.run(param.sql, param.args, function(err, rows) {
							db.close();
							
							if(err) {
								if(param.log) log.error('SQL FAIL: '+err);
								return param.onError(err)
							}
							
							if(param.log) {
								if(rows) {
									log.success('SQL RESULTS:');
									console.log(rows);
								}
								else {
									log.success('SQL lastID: '+ this.lastID);
								}
							}
							
							return param.onSuccess(this);
						});
					}
				},
				onError: param.onError
			});
		},
		updateTableSchema: options => {

			const defauts = {
				dbPath: _param.dbPath,
				showSql: _param.sql,
				dbClose: false
			};

			const param = extend(true, defauts, options);

			_useDatabase({
				dbPath: param.dbPath,
				showSql: _param.sql,
				onSuccess: (db, dbPath) => {
					
					

					db.close();
					if(param.log) log.success('tru_sqlite.tool(): database ('+dbPath+') was closed successfully');
					param.onSuccess();
				},
				onError: param.onError
			});

		}
	}
};
