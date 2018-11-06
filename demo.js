const log = require('tru_log');
const Sqlite = require('tru_sqlite')({
    dbPath: 'generated.sqlite',
    log: true,
    showSql: true,
});

function createTableProfil(cb) {

    Sqlite.createDatabase({
        onSuccess: () => {
            
            Sqlite.createTable({
                name: 'profile',
                schema: [
                    {key: 'id'},
                    {key: 'key_code', type: 'VARCHAR(5)', null: false, unique: true},
                    {key: 'created_by', type: 'INT', null: false}
                ],
                values: [
                    {
                        key_code: 'ADMIN',
                        created_by: 'SYSTEM'
                    },{
                        key_code: 'OPER',
                        created_by: 'SYSTEM'
                    },{
                        key_code: 'MAINT',
                        created_by: 'SYSTEM'
                    }
                ],
                onSuccess: cb,
                onError: console.error
            });
        },
        onError: console.error
    });
}
function createTableUser(cb) {

    Sqlite.createTable({
        name: 'user',
        schema: [
            {key: 'id'},
            {key: 'firstName', type: 'VARCHAR(10)', null: false},
            {key: 'lastName', type: 'VARCHAR(10)'},
            {key: 'profile', type: 'INT', null: false, fk: 'profile.id'}
        ],
        values: [
            {
                firstName: 'Thomas',
                lastName: 'Rudrauf',
                profile: 1
            }
        ],
        onSuccess: cb,
        onError: console.error
    });
}

Sqlite.deleteDatabase({
    onSuccess: () => {
        createTableProfil(function() {
            createTableUser(function() {
                log.success('ALL DONE')
            });
        });
    },
    onError: log.error
});

