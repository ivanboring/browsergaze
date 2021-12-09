let globalRules = {}
let globalComponentInterval = null;
let globalTotalJobs = 0;

$(document).ready(function() {
    $.getJSON('/ajax/rules.json', function(json) {
        globalRules = json;
        // Populate select.
        let options = '';
        for (key in globalRules) {
            if (key !== "screenshotElement") {
                options += `<option value="${key}">${globalRules[key].optionsText}</option>`;
            }
        }

        if ($('#tested').val() == "1") {
            $('#submit').attr('disabled', false);
        }

        $('#listed-rules').html(options)

        $('#add-rule').click(addRule)

        $('#test-component').click(rulesTestComponent)

        $('.capability').click(toggleAllCapabilities)
        $('.breakpoint').click(toggleAllBreakpoints)

        $('#rules').on('change', function() {
            $('#tested').val("0");
            $('#submit').attr('disabled', true);
        });

        $('#accept').on('click', function() {
            $('#tested').val("1");
            $('#submit').attr('disabled', false);
            $('#accept').hide();
            $('#again').hide();
            $('#cancel').show();
        })

        $('#again').on('click', function() {
            $('#submit').attr('disabled', true);
            $('#accept').hide();
            $('#again').hide();
            $('#cancel').show();
        })

        $('.delete-rule').off('click').on('click', function() {
            $(this).parents('li').remove();
        })

        Sortable.create(document.getElementById('rules'), {
            handle: '.drag-hook',
            animation: 150,
            onEnd: restructureComponents
        });
    })
});

function toggleAllCapabilities() {
    let val = $(this).attr('data-capability');
    // First check if all are checked.
    let allChecked = true;
    $('input[data-capability=' + val + ']').each(function() {
        if ($(this).is(":checked") == false) {
            allChecked = false;
        }
    })

    // Toogle them.
    $('input[data-capability=' + val + ']').each(function() {
        $(this).prop('checked', !allChecked);
    })
}

function toggleAllBreakpoints() {
    let val = $(this).attr('data-breakpoint');
    // First check if all are checked.
    let allChecked = true;
    $('input[data-breakpoint=' + val + ']').each(function() {
        if ($(this).is(":checked") == false) {
            allChecked = false;
        }
    })

    // Toogle them.
    $('input[data-breakpoint=' + val + ']').each(function() {
        $(this).prop('checked', !allChecked);
    })   
}

function addRule() {
    const ruleToAdd = globalRules[$('#listed-rules').val()];
    let newRule = '<li class="form-group mb-3"><div class="input-group">';
    newRule += '<div class="input-group-prepend drag-hook"><span class="input-group-text"><i class="fas fa-bars"></i></span></div>';
    if ('prependText' in ruleToAdd) {
        newRule += '<div class="input-group-prepend"><span class="input-group-text">' + ruleToAdd.prependText + '</span></div>';
    }
    let state = 'prepend';
    for (let input of ruleToAdd.inputs) {
        if ('mainElement' in input && input.mainElement) {
            newRule += rulesRenderInput(input);
            // Everything comes after now.
            state = 'append';
        } else {
            newRule += `<div class="input-group-${state}">` + rulesRenderInput(input) + '</div>';
        }
    }
    if ('appendText' in ruleToAdd) {
        newRule += '<div class="input-group-append"><span class="input-group-text">' + ruleToAdd.appendText + '</span></div>';
    }
    newRule += '<div class="input-group-append delete-rule"><span class="input-group-text"><i class="fas fa-trash"></i></span></div>'
    newRule += '</div></li>';
    $(newRule).insertBefore('#the-screenshot');

    $('.delete-rule').off('click').on('click', function() {
        $(this).parents('li').remove();
    })
    console.log(globalRulesCounter);

    Sortable.create(document.getElementById('rules'), {
        handle: '.drag-hook',
        animation: 150,
        onEnd: restructureComponents
    });
    restructureComponents();
    return false;
}

function rulesRenderInput(input) {
    const name = $('#listed-rules').val() + '__' + input.identifier + '__' + globalRulesCounter;
    const parent = $('#listed-rules').val();
    const child = input.identifier;
    const placeHolder = 'placeHolder' in input ? input.placeHolder : '';
    const required = 'required' in input && input.required ? 'required ' : ''
    switch (input.type) {
        case 'text':
            return `<input class="form-control" type="text" data-weight="${globalRulesCounter}" data-group="${parent}" data-id="${child}" name="selector[${globalRulesCounter}][${parent}][${child}]" id="${name}" ${required} placeholder="${placeHolder}" />`;
        case 'number':
            return `<input class="form-control" type="number" data-weight="${globalRulesCounter}" data-group="${parent}" data-id="${child}" name="selector[${globalRulesCounter}][${parent}][${child}]" id="${name}" ${required} placeholder="${placeHolder}" />`;
        case 'select':
            let select = `<select class="form-control" data-weight="${globalRulesCounter}" data-group="${parent}" data-id="${child}" name="selector[${globalRulesCounter}][${parent}][${child}]" ${required} id="${name}">`;
            for (let key in input.options) {
                select += `<option value="${key}">${input.options[key]}</option>`;
            }
            select += '</select>';
            return select;
    }
}

function restructureComponents() {
    let currentWeight;
    let newWeight = -1;
    $("#rules :input").each(function() {
        let componentWeight = parseInt($(this).attr("data-weight"));
        // Check if it's the next component.
        if (componentWeight !== currentWeight) {
            currentWeight = componentWeight;
            newWeight++;
        }
        $(this).attr("data-weight", newWeight);
        let parent = $(this).attr("data-group");
        let id = $(this).attr("data-id");
        $(this).attr("name", `selector[${newWeight}][${parent}][${id}]`)
        $(this).attr("id", `${parent}__${id}__${newWeight}`)
    });
}

function rulesTestComponent() {
    // Reset first
    $('#preview').attr('src', '/pics/loading.gif').css('width', '0%').css('width', 'auto').css('max-width', '100%').css('height', 'auto');
    $('#progressbar');
    let rules = {
        domain: component.domain,
        path: component.path,
        screenshotAll: true,
        projectName: component.projectName,
        steps: {}
    };
    $("#rules :input").each(function() {
        if (!$(this).hasClass('weight')) {
            let id = $(this).attr('id');
            let parts = id.split('__');
            let value = $(this).val();
            if (!(parts[2] in rules['steps'])) {
                rules['steps'][parts[2]] = {'parameters': {}, key: parts[0]}
            }
            rules['steps'][parts[2]]['parameters'][parts[1]] = value;
        }
    });

    globalTotalJobs = Object.keys(rules['steps']).length + 5;
    
    let capabilities = {
        processor: 'puppeteer',
        breakpoints: [
            {width: 1920, height: 1080}
        ],
    }

    $.post("/runner/component/start", {rules: rules, capabilities: capabilities, csrf: component.csrf}, function(result) {
        if (result.status) {
            globalComponentInterval = setInterval(rulesTestInterval, 300);
        }
    });
    $('#loadingTest').modal('toggle');
    return false;
}

function rulesTestInterval() {
    $.getJSON('/runner/component/status/' + component.csrf, function(result) {
        let message = '';
        let screenshot = '';
        let type = 'primary';
        let final = false;
        for (x in result) {
            if (result[x].process == 'screenshotAll' && !final) {
                screenshot = result[x].message.replace('images', '');
            } else if (result[x].process == 'screenshotElement') {
                if (result[x].success) {
                    screenshot = result[x].message.replace('images', '');
                } else {
                    message = result[x].message;
                    type = 'danger';
                }
                final = true;
            } else {
                message = result[x].message;
                type = result[x].success ? 'secondary' : 'danger';
            }
            if (!result[x].success || result[x].process == 'close') {
                clearInterval(globalComponentInterval);
                $('#cancel').hide();
                $('#again').show();
            }
            if (result[x].process == 'close') {
                message = "Finished. Is this the component you wanted?"
                $('#accept').show();
                
            }
        }
        let percent = Math.round(result.length/globalTotalJobs*100);

        $('#progressbar').css('width', percent + '%');
        const messageElement = $('#message');
        if (messageElement.html() !== message) {
            messageElement.html(message);
            messageElement.removeClass().addClass('alert').addClass('alert-' + type)
        }
        const prev = $('#preview');
        if (prev.attr('src') !== screenshot && screenshot) {
            prev.attr('src', screenshot);
        }
        
    })
}