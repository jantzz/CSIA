const mongoose = require("mongoose");
const { stringify } = require("nodemon/lib/utils");

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        require: true,
        min:3,
        max:20,
        unique:true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
    password:{
        type:String,
        require: true,
        min:6,
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    desc:{
        type:String,
        max:50
    },
    birthday:{
        type:String,
        max:10
    }    
},
{ timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);