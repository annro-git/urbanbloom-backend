const mongoose = require("mongoose");

const PageSchema = mongoose.Schema({
    name: String,
    type: {
        type: String,
        enum: ["fruit", "vegetable", "flower"],
    },
    sow: {
        start: Number,
        end: Number,
    },
    harvest: {
        start: Number,
        end: Number,
    },
    image: String,
    text: String,
});

const Page = mongoose.model("pages", PageSchema);
module.exports = Page;
