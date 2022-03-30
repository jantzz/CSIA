const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },
        desc:{
            type:String,
            max: 500,
        },
    },
    {timestamp: true}
);

module.exports = mongoose.model("Posts", PostSchema);