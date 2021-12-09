let zoomData = {
    zoom1: {},
    zoom2: {},
    zoom3: {},
}
let panElements = {}
let panZooms = {};
let globalPanValues = {};
let currentFocus = 'elem1';
let sideBySideInit = false;

$(document).ready(function() {
    $('#before-after').twentytwenty({no_overlay: true});
    $('.tabs').tabslet();
    $('.panel').each(function() {
        $(this).width($(this).width() + 'px');
        $(this).height($(this).height() + 'px');
    })


    for (let i = 1; i <= 3; i++) {
        panElements['elem' + i] = document.getElementById('zoom' + i);
        panZooms['elem' + i] = Panzoom(panElements['elem' + i], {maxScale: 10, minScale: 1, panOnlyWhenZoomed: true});
        panElements['elem' + i].addEventListener('wheel', panZooms['elem' + i].zoomWithWheel)
    }
    
    panElements['elem1'].addEventListener('panzoomzoom', reZoomAll);
    panElements['elem1'].addEventListener('panzoompan', rePanAll);

    $('.tabs li').on('click', function() {
        if ($(this).attr('data-id') == "sidebyside" && !sideBySideInit) {
            sideBySideInit = true;
            $('#sidebyside').width($('#before-after .twentytwenty-before').width() + 'px');
        }

        currentFocus = $(this).attr('data-zoom');

        for (let i = 1; i <= 3; i++) {
            panElements['elem' + i].removeEventListener('panzoomzoom', reZoomAll);
            panElements['elem' + i].removeEventListener('panzoompan', rePanAll);
        }

        panElements[currentFocus].addEventListener('panzoomzoom', reZoomAll);
        panElements[currentFocus].addEventListener('panzoompan', rePanAll);

        for (let i = 1; i <= 3; i++) {
            zoomData['zoom' + i].x = $('#wrapper-zoom' + i).offset().top;
            zoomData['zoom' + i].y = $('#wrapper-zoom' + i).offset().left;
            zoomData['zoom' + i].width = $('#wrapper-zoom' + i).width();
            zoomData['zoom' + i].height = $('#wrapper-zoom' + i).height();
        }
    });
    
});

function rePanAll(event, id) {
    if (typeof id == 'undefined') {
        id = $(this).attr('id');
    }

    if (currentFocus.replace('elem', 'zoom') == id) {
        globalPanValues = event.detail;
    }

    if (event.detail.scale > 1) {
        for (let i = 1; i <= 3; i++) {
            if (currentFocus != 'elem' + i && (panZooms['elem' + i].getPan().x != event.detail.x || panZooms['elem' + i].getPan().y != event.detail.y)) {
                panZooms['elem' + i].pan(event.detail.x, event.detail.y);
            }
        }
    }
}

function reZoomAll(event, id) {
    if (typeof id == 'undefined') {
        id = $(this).attr('id');
    }

    if (currentFocus.replace('elem', 'zoom') == id) {
        globalPanValues = event.detail;
    }
    if (event.detail.scale == 1) {
        for (let i = 1; i <= 3; i++) {
            panZooms['elem' + i].reset();
            panZooms['elem' + i].pan(0, 0);
        }
    } else {
        for (let i = 1; i <= 3; i++) {
            if (currentFocus != 'elem' + i && panZooms['elem' + i].getScale() != event.detail.scale) {
                panZooms['elem' + i].zoom(event.detail.scale);
            }
        }
    }
}