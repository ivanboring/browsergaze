const sqlite3 = require('sqlite3').verbose();
const pjson = require('../package.json');
const fs = require('fs');
const semver = require('semver');

const schemaFolder = './schema/';

const db = {
    db: null,
    loadDb: function() {
        if (!this.db) {
            this.db = new sqlite3.Database(hawkConfig.databaseFile);
        }
    },
    checkUpdates: function() {
        this.loadDb();
        db.db.serialize(function() {
            db.db.get("SELECT value FROM configs WHERE key='version';", function(err, row) {
                if (err) {
                    throw Error('Could not connect to the database. Please verify the sqlite file at ' + hawkConfig.databaseFile);
                }
                // If we need to upgrade
                let versions = [];
                let grade = '';
                if (semver.gt(pjson.version, row.value)) {
                    versions = db.getVersions(pjson.version, row.value);
                    grade = 'up';
                } else if (semver.lt(pjson.version, row.value)) {
                    versions = db.getVersions(row.value, pjson.version, true);
                    grade = 'down';
                }
                console.log(grade)
                console.log(versions)

                for (let version of versions) {
                    let schema = require('../schema/' + version);
                    if (grade == 'up' && typeof schema.up === 'function')  {
                        console.log('Upgrading schema ' + version);
                        schema.up(db.db)
                    } else if (grade == 'down' && typeof schema.down === 'function')  {
                        console.log('Downgrading schema ' + version);
                        schema.down(db.db)
                    }
                }

                if (versions.length > 0) {
                    // Set new version
                    db.db.run("UPDATE configs SET value=? WHERE key='version';", pjson.version);
                }
            });
        });
    },
    setupDbFirstTime: function() {
        this.loadDb();
        const versions = this.getVersions(pjson.version);
        db.db.serialize(function() {
            for (let version of versions) {
                let schema = require('../schema/' + version);
                if (typeof schema.up === "function")  {
                    schema.up(db.db)
                }
            }
            // Set version
            db.db.run("INSERT INTO configs (key, value) VALUES ('version', ?);", pjson.version);
        });        
    },
    getVersions: function(currentProjectVersion, currentDbVersion, reverse) {
        if (!currentDbVersion) {
            currentDbVersion = '0.0.0';
        }
        const versions = [];
        fs.readdirSync(schemaFolder).forEach(file => {
            let version = file.replace('.js', '');
            if (semver.satisfies(version, '>' + currentDbVersion) && semver.satisfies(version, '<=' + currentProjectVersion)) {
                versions.push(version);
            }
        });
        return reverse ? this.sortSemantic(versions).reverse() : this.sortSemantic(versions);
    },
    sortSemantic: function(versions) {
        return versions.map( a => a.split('.').map( n => +n+100000 ).join('.') ).sort()
         .map( a => a.split('.').map( n => +n-100000 ).join('.') );
    }
}

module.exports = db;