// export const config = {
let config = {
    content: [{
        type: 'column',
        content: [{
            type: 'row',
            height: 25,
            content: [{
                type: 'component',
                componentName: 'overview',
                title: 'Overview'
            }]
        },{
            type: 'row',
            content: [{
                type: 'component',
                componentName: 'detailview',
                title: 'Detail View'
            }]
        }]
    }]
};