import { Overview } from '../overview/overview.js';
import { DetailView } from '../detailview/detailview.js';
import { layoutConfig } from './layout-config.js';

let layout = new GoldenLayout(layoutConfig, $('#layout-root'));

layout.registerComponent('overview', function (container, state) {
  $(container.getElement()[0]).load('../static/overview/overview.html', function () {
    window.overview_view = new Overview(container);
    window.overview_view.init();
  });
});

layout.registerComponent('detailview', function (container, state) {
    $(container.getElement()[0]).load('/static/detailview/detailview.html', function () {
      console.log('✅ detailview.html loaded');
      const view = new DetailView(container);
      console.log('✅ DetailView created');
      view.init();
      console.log('✅ DetailView initialized');
      window.detail_view = view;
    });
  });

layout.init();
