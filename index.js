const merge = require('deepmerge');
const sqlite3 = require('sqlite3');
const fs = require('fs');

module.exports =  (_options) => {
	
	const _defauts = {
		database: '',
		verbose: true // TODO
	};
	
	const _param = merge(_defauts, _options);
	
	const _sqlite3 = sqlite3.verbose();
	
	const _useDatabase = options => {
		
		const defauts = {
			dbPath: _param.database,
			onSuccess: db => {
				console.log('db ready');
			},
			onError: err => {
				console.log(err);
			}
		};
		
		const param = merge(defauts, options);
		
		if(!param.dbPath) {
			return param.onError('FAIL SqliteDatabase: dbPath undefined');
		}
		
		_dbPath = __dirname+'/../../'+param.dbPath;
		param.onSuccess(new _sqlite3.Database(_dbPath), _dbPath);
	};
	
	return {
		useDatabase: _useDatabase,
		tableList: options => {
			
			const defauts = {
				dbPath: null,
				onSuccess: tables => {
					console.log('TABLES', tables);
				},
				onError: err => {
					console.log('ERR', err);
				}
			};
			
			const param = merge(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: db => {
					
					db.all('SELECT * FROM sqlite_master', (err, tables) => {
						
						db.close();
						
						if(err) return param.onError.fail(err);
						
						param.onSuccess(tables);
					});
				},
				onError: param.onError
			});
		},
		tableInfo: options => {
			
			var defauts = {
				dbPath: null,
				table: null,
				onSuccess: cols => {
					console.log('COLS', cols);
				},
				onError: err => {
					console.log('ERR', err);
				}
			};
			
            var param = merge(defauts, options);
            
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: db => {
                    
					db.all('pragma table_info('+param.table+')', (err, cols) => {
						
						db.close();
						
						if(err) return param.onError(err);
						
						param.onSuccess(cols);
					});
				},
				onError: param.onError
			});
		},
		createDatabase: options => {
			_useDatabase({
				dbPath: options.dbPath,
				onSuccess: db => {
					db.close();
					if(options.onSuccess) return options.onSuccess();
				},
				onError: options.onError
			});
		},
		createTable: options => {
			
			const defauts = {
				log: false,
				dbPath: null,
				name: 'newTable',
				cols: [
					{key: 'id', type: 'INT'}
				],
				onSuccess: () => {},
				onError: err => {}
			};
			
			const param = merge(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: db => {
					
					let definitionTable = '';
					
					for(let i = 0, j = param.cols.length; i < j ; i++) {
						
						if(param.cols[i].key.toLowerCase() === 'id') {
							definitionTable += 'id INTEGER PRIMARY KEY AUTOINCREMENT';
						}
						else {
							definitionTable += param.cols[i].key+' '+param.cols[i].type;
						}
						
						if(i < j-1) {
							definitionTable += ', ';
						}
					}
					
					let sql = 'CREATE TABLE '+param.name+' ('+definitionTable+')';
					if(param.log) console.log('SQL: '+sql);
					
					db.run(sql, err => {
						db.close();
						if(err) return param.onError(err);
						param.onSuccess();
					});
				},
				onError: param.onError
			});
		},
		drop: options => {
			fs.unlink(__dirname+'/../../'+options.dbPath, err => {
				if(err) return options.onError(err);
				options.onSuccess('DB '+__dirname+'/../../'+options.dbPath+' dropped');
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
				dbPath: null,
				sql: null,
				args: {},
				onSuccess: data => {},
				onError: err => {}
			};
			
			const param = merge(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: db => {
					
					param.sql = param.sql.replace(/:/g, '$');
					for(let key in param.args) {
						param.args['$'+key] = param.args[key];
						delete param.args[key];
					}
					
					if(param.log) {
						console.log('SQL: '+param.sql);
						console.log('	- args: ', param.args);
					}
					
					if(param.sql.split(' ')[0].toUpperCase() === 'SELECT') {
						
						db.all(param.sql, param.args, (err, rows) => {
							
							db.close();
							if(err) {
								if(param.log) console.log('SQL FAIL: '+err);
								return param.onError(err)
							}
							
							if(param.log) console.log('SQL RESULTS: ', rows);
							return param.onSuccess(rows);
						});
					}
					else {
						db.run(param.sql, param.args, function(err, rows) {
							db.close();
							
							if(err) {
								if(param.log) console.log('SQL FAIL: '+err);
								return param.onError(err)
							}
							
							if(param.log) {
								if(rows) {
									console.log('SQL RESULTS: ', rows);
								}
								else {
									console.log('SQL lastID: ', this.lastID);
								}
							}
							
							return param.onSuccess(this);
						});
					}
				},
				onError: param.onError
			});
		}
	}
};