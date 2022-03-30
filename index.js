const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const axios = require("axios");
const Post = require("./models/Post");
const multer = require("multer");
const LocalStorage = require('node-localstorage').LocalStorage


var localStorage = new LocalStorage("./scratch");

//Connecting data base 
dotenv.config();

mongoose.connect(process.env.MONGO_URL , {useNewUrlParser: true, useUnifiedTopology: true}, () =>{
    console.log("Connected to Database");
});

//viewport
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,"views"));

//middleware functions 
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

//routes
app.get("/", (req, res) =>{ 
    res.redirect('login');
});

app.get("/login", (req, res)=>{
    res.render("login.ejs");
});

app.get("/register", (req, res)=>{ 
    res.render("register.ejs");
});

app.get("/home", (req,res) =>{ 

    if(localStorage.getItem("isLoggedIn") === "true"){
        res.render("home.ejs");
    } else{
        res.redirect("login");
    }
});

app.get("/posting", (req, res) =>{ 
    if(localStorage.getItem("isLoggedIn") === "true"){
        res.render("posting.ejs");
    }else{
        res.redirect("login");
    }
});

app.get("/update", (req, res) =>{
    if(localStorage.getItem("isLoggedIn") === "true"){
        res.render("update.ejs");
    }else{
        res.redirect("login");
    }

})

app.get("/logout", (req, res) =>{
    localStorage.setItem("isLoggedIn", false);
    localStorage.setItem("uid", null);
    res.redirect("login");
});

//Register 
app.post("/register",multer().none(), async (req, res)=>{
    
    try{
        //generate hashed password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        //create new user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            birthday: req.body.birthday,
            password: hashedPassword,
        });

        //save user and return response 
        const user = await newUser.save();
        res.status(200).redirect("login");
    }catch(err){
        res.status(500).json(err);
    }
});

//login
app.post("/login", multer().none(), async(req, res)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if(user === null){
            console.log(req.body.email);
            return res.status(404).json("user not found");
        }

        const valpass = await bcrypt.compare(req.body.password, user.password);
        if(!valpass) { 
            return res.status(400).json("wrong password");
        }

        localStorage.setItem("uid", user._id);
        localStorage.setItem("isLoggedIn", true);
        res.status(200).redirect("posts/all"); 
    } catch(err){
        res.status(500).json(err);
    }
});

//create posts 
app.post("/newpost",multer().none(), async(req, res) =>{ 
    let use = localStorage.getItem("uid");
    const newPost = new Post({
        userId: use,
        desc: req.body.desc
    });
    try{
        const savedPost = await newPost.save();
        console.log(savedPost);
        res.status(200).redirect("posts/all");
    }catch(err){
        res.status(500).json(err);
    }
});

//update posts 
app.put("/:id", async(req, res) =>{
    try{
        const post = await Post.findById(req.params.id);
        if(post.userId == req.body.userId){

            await post.updateOne({$set:req.body});
            res.status(200).json("post has been updated");

        }else{
            return res.status(403).json("cannot update a post that is not yours");
        }
    } catch(err){
        res.status(500).json(err);
    }
});

//delete posts 
app.delete("/:id", async(req, res) =>{
    try{
        const post = await Post.findById(req.params.id);
        if(post.userId == req.body.userId){

            await post.deleteOne();
            res.status(200).json("post has been deleted");

        }else{
            return res.status(403).json("cannot delete a post that is not yours");
        }
    } catch(err){
        res.status(500).json(err);
    }
});

//get posts
app.get("/:id", async(req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    }catch(err){
        res.status(500).json(err);
    }
});

//get all posts 
app.get("/posts/all", async (req, res) =>{ 
    try {
        var userid = localStorage.getItem("uid");
        const currentUser = await User.findById(req.body.userId);
        const userPosts = await Post.find({ userId: userid });
        var i = 0;
        var descripts = [];

        userPosts.forEach(function(post){
            let info = post.desc;
            descripts[i] = info;
            i++;
        });
        //if(localStorage.getItem("isLoggedIn") ===true){
        return res.render("home", {descriptions: descripts});
        //}else{
        //    res.redirect("/");
        //}
      } catch (err) {
        console.log(err)
        res.status(500).json(err);
      }
});


//Update user 
app.put("/update-user", multer().none(), async (req, res) =>{
    if(localStorage.getItem("uid") === req.params.id || req.body.isAdmin){
        if(req.body.password){
            try{
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            }catch(err){
                return res.status(500).json(err);
            }
        }

        try{
            const user = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body,
            });
            res.status(200).json("Account has been updated");
        }catch(err){
            return res.status(500).json(err);
        }

    }else{
        return res.status(403).json("You can only update your account");
    }
});
//delete user 
app.delete("/:id", async (req, res) =>{
    if(req.body.userId === req.params.id || req.body.isAdmin){

        try{
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account has been deleted succesfully");
        }catch(err){
            return res.status(500).json(err);
        }

    }else{
        return res.status(403).json("You can only delete your account");
    }
});

app.listen(3000, () =>{
    console.log("Back end server is running");
});