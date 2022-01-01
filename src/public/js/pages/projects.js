$(document).ready(function() {
    $('.run-project').click(function() {
        var project_name = $(this).attr('data-name');
        $.post("/api/project/start/" + project_name, {}, function(result) {
            if ("id" in result) {
                window.location.href = "/projects/" + project_name + "/results?job_id=" + result.id;
            }
        })
        return false;
    });
});