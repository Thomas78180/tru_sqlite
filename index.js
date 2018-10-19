var merge = require('deepmerge');
var sqlite3 = require('sqlite3');

module.exports =  function(_options) {
	
	var _defauts = {
		database: 'db',
		verbose: true // TODO
	};
	
	var _param = merge(_defauts, _options);
	
	var _sqlite3 = sqlite3.verbose();
	
	var _useDatabase = function(options) {
		
		var defauts = {
			dbPath: _param.database,
			onSuccess: function(db) {
				console.log('db ready');
			},
			onError: function(err) {
				console.log(err);
			}
		};
		
		var param = merge(defauts, options);
		
		if(!param.dbPath) {
			return param.onError('FAIL SqliteDatabase: dbPath undefined');
		}
		
		_dbPath = param.dbPath;
		param.onSuccess(new _sqlite3.Database(process.cwd()+_dbPath));
	};
	
	return {
		useDatabase: _useDatabase,
		tableList: function(options) {
			
			var defauts = {
				dbPath: null,
				onSuccess: function(tables) {
					console.log('TABLES', tables);
				},
				onError: function(err) {
					console.log('ERR', err);
				}
			};
			
			var param = merge(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: function(db) {
					
					db.all('SELECT * FROM sqlite_master', function(err, tables) {
						
						db.close();
						
						if(err) return param.onError.fail(err);
						
						param.onSuccess(tables);
					});
				},
				onError: param.onError
			});
		},
		tableInfo: function(options) {
			
			var defauts = {
				dbPath: null,
				table: null,
				onSuccess: function(cols) {
					console.log('COLS', cols);
				},
				onError: function(err) {
					console.log('ERR', err);
				}
			};
			
            var param = merge(defauts, options);
            
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: function(db) {
                    
					db.all('pragma table_info('+param.table+')', function(err, cols) {
						
						db.close();
						
						if(err) return param.onError(err);
						
						param.onSuccess(cols);
					});
				},
				onError: param.onError
			});
		},
		createDatabase: function(options) {
			_useDatabase({
				dbPath: options.dbPath,
				onSuccess: function(db) {
					db.close();
					if(options.onSuccess) return options.onSuccess();
				},
				onError: options.onError
			});
		},
		createTable: function(options) {
			
			var defauts = {
				log: false,
				dbPath: null,
				name: 'newTable',
				cols: [
					{key: 'id', type: 'INT'}
				],
				onSuccess: function() {},
				onError: function(err) {}
			};
			
			var param = merge(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: function(db) {
					
					var definitionTable = '';
					
					for(var i = 0, j = param.cols.length; i < j ; i++) {
						
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
					
					var sql = 'CREATE TABLE '+param.name+' ('+definitionTable+')';
					if(param.log) console.log('SQL: '+sql);
					
					db.run(sql, function(err) {
						db.close();
						if(err) return param.onError(err);
						param.onSuccess();
					});
				},
				onError: param.onError
			});
		},
		drop: function() {
			
		},
		inserts: function(options) {
			// TODO inserer un lot
		},
		insert: function(options) {
			// pour tests unitaires
			return this.query(options);
		},
		select: function(options) {
			// pour tests unitaires
			return this.query(options);
		},
		update: function(options) {
			// pour tests unitaires
			return this.query(options);
		},
		delete: function(options) {
			// pour tests unitaires
			return this.query(options);
		},
		query: function(options) { // options: sql, args, onSuccess, onError et log
			
			var defauts = {
				log: false,
				dbPath: null,
				sql: null,
				args: {},
				onSuccess: function(data) {},
				onError: function(err) {}
			};
			
			var param = merge(defauts, options);
			
			_useDatabase({
				dbPath: param.dbPath,
				onSuccess: function(db) {
					
					param.sql = param.sql.replace(/:/g, '$');
					for(var key in param.args) {
						param.args['$'+key] = param.args[key];
						delete param.args[key];
					}
					
					if(param.log) {
						console.log('SQL: '+param.sql);
						console.log('	- args: ', param.args);
					}
					
					if(param.sql.split(' ')[0].toUpperCase() === 'SELECT') {
						
						db.all(param.sql, param.args, function(err, rows) {
							
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