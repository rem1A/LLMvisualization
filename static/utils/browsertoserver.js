// import { publish } from './pubsubscribe.js';
function fetch_data(json) {
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

function load_precomputed(json) {
    console.log('Start loading precomputed data...');
    $.ajax({
        url: '/load_precomputed',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish('data', data);
            console.log('Precomputed data loaded successfully:', data);
        }
    });
}