// import { publish } from './pubsubscribe.js';
function fetch_data(json) {
    // GPT代码 如果没有传 threshold，就设置默认值（可选）
    // if (!json.threshold) {
    //     json.threshold = 0.0001;
    // }

    $.ajax({
        url: '/fetch_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish('data', data);
            console.log('Data fetched successfully:', data);
        }
    });
}