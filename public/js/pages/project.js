$(document).ready(function() {
    $('#add-breakpoint').click(projectAddBreakpoint);
    $('.delete-rule').off('click').on('click', function() {
        $(this).parents('.mb-3').remove();
    })
});

function projectAddBreakpoint() {
    let html = '<div class="form-group mb-3"><div class="input-group input-group-alternative">';
    html += `<input type="number" class="form-control" name="breakpoint_width[]" placeholder="Width pixels" />`
    html += '<div class="input-group-append"><span class="input-group-text">x</span></div>';
    html += '<input type="number"  class="form-control"  name="breakpoint_height[]"  placeholder="Height pixels">';
    html += '<div class="input-group-append"><span class="input-group-text">px</span></div>'
    html += '<div class="input-group-append delete-rule"><span class="input-group-text"><i class="fas fa-trash"></i></span></div>'
    html += '</div></div>';
    $('.breakpoints').append(html);
    $('.delete-rule').off('click').on('click', function() {
        $(this).parents('.mb-3').remove();
    })
    return false;
}