$('#project-choice').hide();
$(document).ready(function() {
    showProjects();
    $('#role').on('change', showProjects);
})

function showProjects() {
    if ($('#role').val() == "0" || $('#role').val() == "2") {
        $('#project-choice').slideUp();
    } else {
        $('#project-choice').slideDown();
    }
}