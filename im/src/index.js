'use strict';
exports.main_handler = async (event, context) => {
    console.log("Hello World", event, context)
    return event
};
