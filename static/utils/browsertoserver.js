function fetch_data(json) {
    $.ajax({
        url: '/_fetch_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish('simulation', data.simulation);
            publish('simulation_info', [data.embedding, data.simulation_info]);
        }
    });
}


