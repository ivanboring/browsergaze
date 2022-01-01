module.exports = {
    up: async function(db) {
        db.serialize(function() {
            // Create user table.
            db.run("CREATE TABLE users ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                password VARCHAR(40), \
                first_name VARCHAR(100), \
                last_name VARCHAR(100), \
                role INTEGER, \
                email VARCHAR(255) \
            )");

            // Create project table.
            db.run("CREATE TABLE projects ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name VARCHAR(50), \
                dataname VARCHAR(50), \
                fail_directly INTEGER, \
                run_sync INTEGER, \
                default_host_path TEXT, \
                default_username VARCHAR(255), \
                default_password VARCHAR(255) \
            )");

            // Create project breakpoints table.
            db.run("CREATE TABLE project_breakpoints ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                project_id INTEGER, \
                width INTEGER, \
                height INTEGER \
            )");

            // Create project capabilities table.
            db.run("CREATE TABLE project_capabilities ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                project_id INTEGER, \
                capability_id INTEGER \
            )");

            // Create generator server.
            db.run("CREATE TABLE generator_servers (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                name VARCHAR(255), \
                hostname VARCHAR(255), \
                path VARCHAR(255), \
                port INTEGER, \
                concurrency INTEGER, \
                server_type INTEGER \
            )")

            // Create capability.
            db.run("CREATE TABLE capabilities (\
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                generator_server_id INTEGER, \
                browser_name VARCHAR(100), \
                browser_version VARCHAR(100), \
                platform VARCHAR(100), \
                platform_version VARCHAR(100), \
                device_name VARCHAR(100), \
                processor VARCHAR(100), \
                is_browser_default INTEGER, \
                is_mobile INTEGER, \
                unique_id VARCHAR(32), \
                advanced_config TEXT \
            )")

            // Create page table.
            db.run("CREATE TABLE pages ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                uuid VARCHAR(32), \
                project_id INTEGER, \
                name VARCHAR(255), \
                path TEXT \
            )");

            // Create components table.
            db.run("CREATE TABLE components ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                page_id INTEGER, \
                project_id INTEGER, \
                uuid VARCHAR(32), \
                name VARCHAR(255), \
                default_visual_regression_threshold FLOAT, \
                default_browser_regression_threshold FLOAT \
            )");

            // Create rules table.
            db.run("CREATE TABLE rules ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                component_id INTEGER, \
                key VARCHAR(255), \
                weight INTEGER, \
                ruleset TEXT \
            )");

            // Create project user table.
            db.run("CREATE TABLE project_user ( \
                user_id INTEGER, \
                project_id INTEGER \
            )");

            // Set index.
            db.run("CREATE UNIQUE INDEX idx_project_user \
                ON project_user (user_id, project_id);");

            // Create baselines table
            db.run("CREATE TABLE baseline ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                project_id INTEGER, \
                component_id INTEGER, \
                capability_id INTEGER, \
                screenshot_id INTEGER, \
                breakpoint_id INTEGER, \
                created INTEGER, \
                path VARCHAR(255) \
            )");
            
            // Create finished jobs table.
            db.run("CREATE TABLE finished_pages ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                project_id INTEGER, \
                page_id INTEGER, \
                status INTEGER, \
                browser_failures INTEGER, \
                browser_comparison_not_run INTEGER, \
                regression_failures INTEGER, \
                regressions INTEGER, \
                missing_components INTEGER, \
                added_components INTEGER, \
                created INTEGER \
            )");

            // Create jobs table.
            db.run("CREATE TABLE jobs ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            uuid VARCHAR(32), \
            project_id INTEGER, \
            max_regression FLOAT, \
            max_browser_failure FLOAT, \
            status INTEGER \
            )");

            // Create screenshots table.
            db.run("CREATE TABLE screenshots ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                project_id INTEGER, \
                page_id INTEGER, \
                component_id INTEGER, \
                job_id INTEGER, \
                capability_id INTEGER, \
                breakpoint_id INTEGER, \
                path VARCHAR(255), \
                capture_failure INTEGER, \
                width INTEGER, \
                height INTEGER, \
                created_time INTEGER, \
                screenshot_time INTEGER, \
                generator_server INTEGER, \
                is_baseline INTEGER, \
                status INTEGER, \
                visual_regression FLOAT, \
                browser_regression FLOAT, \
                error TEXT \
            )");

            // Create breakpoint capabilities per component.
            db.run("CREATE TABLE component_capability_breakpoint ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                component_id INTEGER, \
                capability_id INTEGER, \
                breakpoint_id INTEGER, \
                threshold FLOAT \
            )");

            // Create browser regression threshold.
            db.run("CREATE TABLE browser_threshold ( \
                id INTEGER PRIMARY KEY AUTOINCREMENT, \
                component_id INTEGER, \
                capabilities_id_from INTEGER, \
                capabilities_id_to INTEGER, \
                breakpoint_id INTEGER, \
                project_id INTEGER, \
                active INTEGER, \
                browser_threshold FLOAT \
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

            // Create puppeteer generator server
            db.run("INSERT INTO generator_servers (name, hostname, path, port, server_type, concurrency) VALUES (?, ?, ?, ?, ?, ?);", 
                'Built-in',
                'localhost',
                '',
                '',
                'puppeteer',
                1
            );

            // Create browser diff
            db.run("CREATE TABLE browser_diffs ( \
                id	INTEGER PRIMARY KEY AUTOINCREMENT, \
                job_id	INTEGER, \
                component_id	INTEGER, \
                page_id	INTEGER, \
                project_id	INTEGER, \
                created_time INTEGER, \
                threshold_id INTEGER, \
                from_capability INTEGER, \
                from_screenshot_id INTEGER, \
                to_screenshot_id INTEGER, \
                breakpoint_id INTEGER, \
                to_capability INTEGER, \
                breakpoint	INTEGER, \
                diff FLOAT, \
                path VARCHAR(255), \
                status	INTEGER \
            );")

            // Create settings values table
            db.run("CREATE TABLE settings ( \
                key VARCHAR(255), \
                value TEXT \
            )");

            // Default settings
            db.run("INSERT INTO settings (key, value) VALUES (?, ?);", 
                'browser_diff_fuzz',
                '10',
            );

            // Default settings
            db.run("INSERT INTO settings (key, value) VALUES (?, ?);", 
                'visual_regression_fuzz',
                '1',
            );
        })
    }
}