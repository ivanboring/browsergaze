$(document).ready(function() {
    $('.start-job-component').click(function() {
        $.post("/api/component/start/" + $(this).attr('data-uuid'), {}, function(result) {
            if ("id" in result) {
                window.location.href = "/projects/" + project_name + "/results?job_id=" + result.id;
            }
        });
        return false;
    })
});