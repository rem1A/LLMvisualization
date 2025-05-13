
let layout = new GoldenLayout(config);

let detail_view;
let overview_view;

layout.registerComponent('detailview', function (container, state) {
    $(container.getElement()[0]).load('../static/detailview/detailview.html');
    detail_view = new DetailView(container);
});


layout.registerComponent('overview', function (container, state) {
    $(container.getElement()[0]).load('../static/overview/overview.html');
    overview_view = new Overview(container);
});


layout.on('itemCreated', (item) => {
    if (item.config.cssClass) {
        item.element.addClass(item.config.cssClass);
    }
});

layout.init();

// define global start function
function loadData() {
    let name = $('#simulation').val();
    if(name == 'none')
        return;

    fetch_data({'dataset':name});
}

loadData();