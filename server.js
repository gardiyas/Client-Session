//Admin account:
//  firstName: "Haytham", lastName: "Qushtom", email: "HQ@seneca.ca", phNum: 1233211234, Password: 123456, role: "admin"

//User account:
//  firstName: "John", lastName: "Wick", email: "johnwick@gmail.com", phNum: 1231231234, Password: 123456, role: "user"

var HTTP_PORT = process.env.PORT || 8080;
//npm install express
var express = require("express");
const path = require("path");
const app = express();
//npm install body-parser
const bodyParser = require("body-parser");
//npm install express-handlebars
const handle = require("express-handlebars");
//npm install mongoose
const mongoose = require("mongoose");

//npm install bcryptjs
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

app.use(express.static("static"));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//npm install multer
const multer = require("multer");

//where the picture for the plans will be stored.
var planPicStorage = multer.diskStorage({
    destination: "static/planPictures/",
    filename: (req, file, cb) => {       
        cb(null, "planPic.jpg");
    }
})

const uploadPic = multer({storage: planPicStorage});

app.engine(".hbs", handle({extname:".hbs"}));
app.set("view engine", ".hbs");

mongoose.connect("mongodb+srv://emredbweb:Password!@web322clusteremre.cvsbc.mongodb.net/Web322db?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

const Schema = mongoose.Schema;

//collection for accounts to register and login
const user_Schema = new Schema( {
    "firstName": String,
    "lastName": String,
    "email": { "type": String, "unique": true},
    "phNum": Number,
    "Password": String,
    "role": String,
    "Purchase": Object
});

var Accounts = mongoose.model("User", user_Schema);

//ADMIN
let newUser1 = new Accounts({
    firstName: "Haytham", lastName: "Qushtom", email: "HQ@seneca.ca", phNum: 1233211234, Password: 123456, role: "admin"
}).save((err, data) => {
    if(err){
        console.log("create user error: " + err);
    }
    else {
        console.log("success. User created. " + data);
    }
})

//ADMIN
let newUser2 = new Accounts({
    firstName: "Kazvin", lastName: "Mendez", email: "kazvinmendez@gmail.com", phNum: 1234567890, Password: 123456, role: "admin"
}).save((err, data) => {
    if(err){
        console.log("create user error: " + err);
    }
    else {
        console.log("success. User created. " + data);
    }
})

//USER
let newUser3 = new Accounts({
    firstName: "John", lastName: "Wick", email: "johnwick@gmail.com", phNum: 9876543210, Password: 123456, role: "user"
}).save((err, data) => {
    if(err){
        console.log("create user error: " + err);
    }
    else {
        console.log("success. User created. " + data);
    }
})


//object storing data for WebHosting.hbs
var planGroup = [ 
    {
    name: "Starter",
    desc: "Affordable, great for personal projects",
    price: "4.99",
    slot: 1,
    hot: true
    },
    {
    name: "Advanced",
    desc: "For those Looking for a little more",
    price: "9.99",
    slot: 2,
    hot: false
    },
    {
    name: "Premium",
    desc: "Put your website into overdrive",
    price: "19.99",
    slot: 3,
    hot: false
    }
]

//variables to create cart
var userPlan = null;
var cart = true;


const clientSession = require("client-sessions");

//authorization of the user
app.use(clientSession({
    //cookie = any name for the session
    cookieName:"session",
    //secret = string used to encrypt the session
    secret: "week10-web322", 
    //duration = time of the session in milliseconds. 1 second = 1000. This is set to 5 minutes
    duration: 5 * 60 * 1000,
    //activeduration = after 5 min if the website is still being used it will extend by this value (2 min)
    activeDuration: 5 * 60 * 1000
}));


function login(req, res, next) {
    if(req.session.user)
        next();
    else
        res.redirect("/");
}

//function to store data from page and used if error occurs
function getPreviousData(reqBody) {
    let previousData = {};
    for (const input in reqBody) {
      previousData[input] = reqBody[input];
    }
    return previousData;
  }



// setup a 'route' to listen on the default url path
app.get("/", function(req, res) {
    if(req.session.user){
        if(req.session.user.role == "admin")
            res.redirect("admindashboard");
        else
            res.redirect("/dashboard");
    }
    else        
        res.render("Index", {layout:false});
});


app.get("/dashboard", login, (req, res) => {
    if(req.session.user)
        res.render("dashboard", { data:req.session.user, layout:false});
    else
        res.status(404).send("page not found!");
});

app.get("/admindashboard", login, (req, res) => {
    if(req.session.user)
        res.render("admindashboard", { data:req.session.user, layout:false});
    else
        res.status(404).send("page not found!");
});


app.get("/login", function(req, res) {   
    if(req.session.user){
        res.redirect("/");
    } else {
        res.render("Login", {
            layout:false
        })
    }
});

app.get("/registration", function(req, res) {    
    res.render("Registration", {
        layout:false
    })
});

app.get("/plans", function(req, res) {    
    res.render("WebHosting", {
        plan:planGroup, 
        layout:false
    })
});


app.get("/createplan", function(req, res) {
    res.render("createplan", {layout:false})
});

app.get("/editplan", function(req, res) {
    res.render("editplan", {layout:false})
});

app.post("/newplan", uploadPic.single("picture"), (req, res) => {
    if(req.body.hot == "true"){
        for (let i = 0; i < planGroup.length; i++) {
            planGroup[i].hot = false;
          }
    }

    let errorMsg = "";
    if (isNaN(req.body.planPrice)) {
        errorMsg += "The price can only be a number. ";
    }
    if(req.body.planName == "" || req.body.planPrice == "" || req.body.planDesc == "") {
        errorMsg += "All fields must be filled. ";
    } 
    if (req.body.planDesc > 50 || req.body.planName > 20) {
        errorMsg += "The description or name is too big. ";
    } 
    if(errorMsg) {
        console.log("Create plan errors: " + errorMsg);
        res.render("editPlan", {err:errorMsg, layout:false});
    } else {
        if(req.session.user.role == "admin") {
            var fileName = req.file.filename;
            
            console.log("Plan name: " + req.body.planName + " Plan price: " + req.body.planPrice  + " Plan Desc: " + req.body.planDesc + " Position: " + req.body.position + " Hot: " + req.body.hot); 
            console.log("File uploaded. Name is: " + fileName);

            if(req.body.position == 1) {
                planGroup[0].name = req.body.planName;
                planGroup[0].desc = req.body.planDesc;
                planGroup[0].price = req.body.planPrice;
                planGroup[0].hot = req.body.hot;
            }else if (req.body.position == 2) {
                planGroup[1].name = req.body.planName;
                planGroup[1].desc = req.body.planDesc;
                planGroup[1].price = req.body.planPrice;
                planGroup[1].hot = req.body.hot;
            }else if(req.body.position == 3) {
                planGroup[2].name = req.body.planName;
                planGroup[2].desc = req.body.planDesc;
                planGroup[2].price = req.body.planPrice;
                planGroup[2].hot = req.body.hot;
            }
            let msg = "Plan updated";

            res.render("editplan", {msg:msg, layout:false})
        } else
        res.render("editplan", {err:"You are not an admin", layout:false});
    }
});

app.post("/addToCart", (req, res) => {
    if(req.session.user){
        console.log("Plan to add to cart: " + req.body.submit);
        userPlan = req.body.submit-1;
        res.redirect("plans");
    } else
    res.render("WebHosting", {msg:"You must be logged in to do that.", plan:planGroup, layout: false});

});


app.get("/usercart", (req, res) => {
    if(req.session.user){
        if(userPlan==null){
            res.render("usercart", {layout:false});
        } else
            res.render("usercart", {plan:planGroup[userPlan],cart:cart, layout:false});
    } else 
    res.status(404).send("You must be logged in");
})



app.post("/calculate", (req, res) => {
    let result = "$" + req.body.cost * req.body.months;
    res.json({result:result});
});


app.post("/order", (req, res) => {
    userPlan = null;
    res.redirect("/");
});


app.post("/register", async (req, res) => {
    let previousData = getPreviousData(req.body);

    fName = req.body.fName,
    lName = req.body.lName,
    email = req.body.email,
    phNum = req.body.phNumber;
    pass = req.body.password;

    let errorMsg = "";

    //encrypt the password
    const pass1 = await bcrypt.hash(req.body.password, 10);
    var pass2 = bcrypt.hashSync(req.body.password, salt);

    console.log("password: " + pass + " Password1 " + pass1 + " Password 2: " + pass2);

    if(req.body.password != req.body.password2){
        errorMsg += "Passwords do not match. ";
    }
    if (isNaN(phNum)) {
        errorMsg += "The phone number can only contain numbers. ";
    }
    if(fName == "" || lName == "" || email == "" || phNum == "" || pass == "") {
        errorMsg += "All fields must be filled. ";
    } 
    if (req.body.password.length < 6 || req.body.password.length > 12){
        errorMsg += "Password must be 6-12 characters. ";
    } 
    if(errorMsg) {
        console.log("Registration error: " + errorMsg);
        res.render("Registration", {msg:errorMsg, previousData:previousData, layout:false});
    } else{
        //if no error msg create the user in the database.
        let newUser = new Accounts({
            firstName: fName, lastName: lName, email: email, phNum: phNum, Password: req.body.password, role: "user"
        }).save((err, data) => {
            if(err){
                console.log("create user error: " + err);
                res.send("User error: " + err);
            }
            else {
            console.log("success. User created. " + data);
            res.redirect("/login");
            }
        })
    }
})


app.post("/logged", (req, res) => {
    let previousData = getPreviousData(req.body);


    //function to search for the user
    findUser = function (userData) {
        return Accounts.findOne({
            $and: [
                { email: userData.email },
                { Password: userData.password }
            ]
        }).exec().then((data) => {
            console.log("data from function: " + data);
            return data;
        })
    }   

    if(req.body.email == "" || req.body.password == ""){
        let errorMsg = "Either the username or password is empty.";
        console.log("Login error: " + errorMsg);
        return res.render("Login", {msg:errorMsg, layout:false})
    } else{
        findUser(req.body).then((data) => {
            if(data){
                if(data.role === 'admin'){
                    console.log("Admin. " + data.firstName + " " + data.lastName);
                    req.session.user = {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        role: data.role
                    };
                    res.redirect("/admindashboard");
                } else {
                console.log("User. " + data.firstName + " " + data.lastName);
                req.session.user = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role
                };
                res.redirect("/dashboard");
                }
            } else {
                let errorMsg = "User not located in database. ";
                console.log(errorMsg);
                res.render("Login", {msg:errorMsg, previousData:previousData, layout:false});
            }
        });

    }

});

app.get("/logout", (req, res) => {
    req.session.reset();
    userPlan = null;
    res.redirect("/login");
  });

// http://localhost:8080/home
app.use(function (req, res) {
    res.status(404).send("page not found!");
    //res.redirect("/");
});


// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT);
