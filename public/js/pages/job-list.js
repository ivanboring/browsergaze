$(document).ready(function() {
    statusUpdate();
})

function statusUpdate() {
    $.getJSON('/api/job/status/' + project_name + '?ids=' + screenshot_ids, function(result) {
        let allFinished = true;
        for (let row of result) {
            if ($("#status-" + row.id).attr('data-status') !== row.status) {
                $("#status-" + row.id).attr('data-status', row.status);
                let message = '';
                switch (row.status) {
                    case 0:
                        message = "No shot yet";
                        break;
                    case 1:
                        message = "Grabbing shot";
                        break;
                    case 2:
                        message = "Waiting test";
                        $("#screenshot-" + row.id + " img").attr('src', row.path.substr(8));
                        break;
                    case 3:
                        message = "Testing";
                        $("#screenshot-" + row.id + " img").attr('src', row.path.substr(8));
                        break;
                    case 4:
                        message = "Finished";
                        $("#screenshot-" + row.id + " img").attr('src', row.path.substr(8));
                        $("#diff-" + row.id + " img").attr('src', row.path.substr(8).replace('.png', '_diff.png'));
                        $("#visual-regression-" + row.id).html(row.visual_regression + '%');
                        break;
                }
                if (row.status !== 4) {
                    allFinished = false;
                }
                $("#status-" + row.id).html(message);
            }
        }
        if (!allFinished) {
            setTimeout(statusUpdate, 1000);
        }
    })
}