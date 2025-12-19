// import { config } from './layout-config.js';
// import { DetailView } from '../detailview/detailview.js';
// import { Overview } from '../overview/overview.js';
// import { fetch_data } from '../utils/browsertoserver.js';
let layout = new GoldenLayout(config);

let detail_view;
let overview_view;

layout.registerComponent('detailview', function (container, state) {
    $(container.getElement()[0]).load('static/detailview/detailview.html');
    detail_view = new DetailView(container);
});


layout.registerComponent('overview', function (container, state) {
    $(container.getElement()[0]).load('static/overview/overview.html');
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
    const folder_name = window.prompt('Enter the folder name to load data:');
    if (!folder_name) {
        alert('Please enter a valid folder name.');
        return;
    }
    document.getElementById('folder-input').value = folder_name;
    fetch_data({'folder':folder_name});
}

window.addEventListener('load', () => {
    setTimeout(() => {
        loadData();
    }, 300);
});