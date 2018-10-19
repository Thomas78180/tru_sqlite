# tru_sqlite

Manage sqlite databases with node.js

## Usage

Import the package

```
const Sqlite = require('tru_sqlite')({});
```

- Create a new database
```
Sqlite.createDatabase({
    dbPath: <yourDbPath>,
    onSuccess: () => {},
    onError: err => {}
});
```

- Add a table
```
Sqlite.createTable({
    dbPath: <yourDbPath>,
    name: 'users',
    cols: [
        {key: 'id', type: 'INT'},
        {key: 'email', type: 'VARCHAR(30)'},
        {key: 'password', type: 'VARCHAR(20)'},
        {key: 'grade', type: 'INT'},
        {key: 'token', type: 'VARCHAR(50)'}
    ],
    onSuccess: options.onSuccess,
    onError: options.onError
});
```

- Get table schema
```
Sqlite.tableInfo({
    dbPath: <yourDbPath>,
    table: 'users',
    onSuccess: results => {},
    onError: err => {}
});
```

- Run CRUD queries
```
db.query({
    dbPath: <yourDbPath>,
	sql: 'SELECT * FROM users',
	onSuccess: results => {},
	onError: err => {}
});
```

```
db.query({
    dbPath: <yourDbPath>,
	sql: 'INSERT INTO users VALUES (NULL, :email, :password, :grade, :token)',
	args: {
		email: 'thomas.rudrauf@gmail.com',
		password: 'abc123efg',
		grade: 1,
        token: 'eyAiaXNzIjogImVraW5vLmNvbSIsICJuYW1lIjogIkpvaG4gRG9lIiwgImFkbWluIjogdHJ1ZSB9'
	},
	onSuccess: results => {},
	onError: err => {}
});
```

```
db.query({
    dbPath: <yourDbPath>,
	sql: 'UPDATE users SET grade = :grade WHERE id = :id',
	args: {
		grade: 2,
		id: 1
	},
	onSuccess: results => {},
	onError: err => {}
});
```

```
db.query({
    dbPath: <yourDbPath>,
	sql: 'DELETE FROM users WHERE email = :email',
	args: {
		email: 'thomas.rudrauf@gmail.com',
	},
	onSuccess: results => {},
	onError: err => {}
});
```