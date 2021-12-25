$(document).ready(function() {
    statusUpdate();

    $('.set-baseline').click(baseline);
})

function baseline() {
    $.getJSON('/api/baseline/set/' + $(this).attr('data-id'), function(result) {
        if ("status" in result && result.status) {
            let img = $("#screenshot-" + result.id + " img").attr('src');
            $("#baseline-" + result.id + " img").attr('src', img);
            $("#diff-" + result.id + " img").attr('src', img);
            $("#is-baseline-" + result.id).html('Baseline');
            $("#visual-regression-" + result.id).html('0%');
        }
    });
    return false;
}

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
                    case 5:
                        $("#screenshot-" + row.id + " img").attr('src', '/pics/failed.png').css('height', '50px');
                        $("#diff-" + row.id + " img").attr('src', '/pics/failed.png').css('height', '50px');
                        message = "Failed";
                        break;
                }
                if (row.status < 4) {
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