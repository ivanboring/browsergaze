const yaml = require('js-yaml');
const fs = require('fs');
const helper = require('./helper');

const permissions = {
    permissionsPerRole: {},
    roleHasPermission: function(role, permission) {
        // Load permissions into memory.
        if (Object.keys(this.permissionsPerRole).length === 0) {
            this.loadPermissions();
        }
        
        // Super admin can do anything.
        if (role == 1) {
            return true;
        }
        return permission in this.permissionsPerRole && this.permissionsPerRole[permission].indexOf(role.toString()) ? true : false;
    },
    loadPermissions: function() {
        let confdir = helper.getConfigDirecory('roles');
        let files = fs.readdirSync(confdir);
        for (let file of files) {
            let roledata = yaml.load(fs.readFileSync(confdir + file))
            for (let x in roledata.permissions) {
                if (roledata.permissions[x]) {
                    if (!(x in this.permissionsPerRole)) {
                        this.permissionsPerRole[x] = []
                    }
                    this.permissionsPerRole[x].push(roledata.id.toString());
                }
            }
        }
    }
}

module.exports = permissions;