const fs = require('fs');
const db = require('./db');
const user = require('./user');
const validate = require('./validate');
const defaults = require('./defaults');
const helper = require('./helper');

const page = {
    getPageForProject: async function(req, project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT pg.* FROM pages pg WHERE pg.project_id=?;", project_id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT pg.* FROM pages pg LEFT JOIN projects p ON p.id=pg.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, project_id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    }
}

module.exports = page;