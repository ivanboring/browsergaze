
module.exports = {
    up: function(db) {
        // Create user table.
        db.run("CREATE TABLE users ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            username VARCHAR(40), \
            password VARCHAR(40), \
            first_name VARCHAR(100), \
            last_name VARCHAR(100), \
            role INT, \
            email VARCHAR(255) \
        )");

        // Create project table.
        db.run("CREATE TABLE projects ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            name VARCHAR(50), \
            fail_directly INT, \
            default_host VARCHAR(255), \
            default_username VARCHAR(255), \
            default_password VARCHAR(255) \
        )");

        // Create generator server.
        db.run("CREATE TABLE generator_servers (\
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            hostname VARCHAR(255), \
            path VARCHAR(255), \
            port INT, \
            server_type INT \
        )")

        // Create capability.
        db.run("CREATE TABLE capbilities (\
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            generator_server_id INT, \
            browser_name VARCHAR(100), \
            platform VARCHAR(100), \
            version VARCHAR(100), \
            device_name VARCHAR(100), \
            selenium_version VARCHAR(100), \
            driver_version VARCHAR(100), \
            is_browser_default INT, \
            is_mobile INT, \
            advanced_config TEXT \
        )")

        // Create job table.
        db.run("CREATE TABLE jobs ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            project_id INT, \
            name VARCHAR(50), \
            host VARCHAR(255) \
        )");

        // Create page table.
        db.run("CREATE TABLE pages ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            job_id INT, \
            path VARCHAR(255) \
        )");

        // Create components table.
        db.run("CREATE TABLE components ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            page_id INT, \
            name VARCHAR(255), \
            default_visual_regression_threshold FLOAT, \
            default_browser_regression_threshold FLOAT, \
            selector VARCHAR(255) \
        )");

        // Create rules table.
        db.run("CREATE TABLE rules ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            component_id INT, \
            key VARCHAR(255), \
            value TEXT, \
            description VARCHAR(255) \
        )");

        // Create project user table.
        db.run("CREATE TABLE project_user ( \
            user_id INT, \
            page_id INT \
        )");

        // Set index.
        db.run("CREATE UNIQUE INDEX idx_project_user \
            ON project_user (user_id, page_id);");

        // Create baselines table
        db.run("CREATE TABLE baseline ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            component_id INT, \
            capability_id INT, \
            created INT, \
            path VARCHAR(255) \
        )");

        // Create breakpoints table
        db.run("CREATE TABLE breakpoints ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            width INT, \
            name VARCHAR(255) \
        )");
        
        // Create finished jobs table.
        db.run("CREATE TABLE finished_jobs ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            project_id INT, \
            job_id INT, \
            status INT, \
            browser_failures INT, \
            browser_comparison_not_run INT, \
            regression_failures INT, \
            regressions INT, \
            missing_components INT, \
            added_components INT, \
            created INT \
        )");

        // Create screenshots table.
        db.run("CREATE TABLE screenshots ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            project_id INT, \
            job_id INT, \
            finished_job_id INT, \
            path VARCHAR(255), \
            capture_failure INT, \
            width INT, \
            height INT, \
            created INT \
        )");

        // Create capabilities per component.
        db.run("CREATE TABLE component_capability ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            component_id INT, \
            capabilities_id INT, \
            is_browser_default INT, \
            is_mobile_default INT, \
            browser_compare INT, \
            mobile_compare INT \
        )");

        // Create breakpoint capabilities per component.
        db.run("CREATE TABLE component_capability_breakpoint ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            component_capability_id INT, \
            breakpoint_id INT \
        )");

        // Create browser regression threshold.
        db.run("CREATE TABLE browser_threshold ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            component_id INT, \
            capabilities_id_from INT, \
            capabilities_id_to INT, \
            breakpoint_id INT, \
            browser_threshold INT \
        )");

        // Create notifications table
        db.run("CREATE TABLE notification_setup ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            notification_handler VARCHAR(255), \
            setup TEXT \
        )");

        // Create config values table
        db.run("CREATE TABLE configs ( \
            key VARCHAR(255), \
            value VARCHAR(255) \
        )");
    }
}