import { log } from "console";
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

const app = express();
//Middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs"); //Setting up view engine

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "simplesecret");
    req.user = await User.findById(decoded._id);
    next(); //contains information of all the users
  } else {
    res.render("login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

/*app.get("/success", (req, res) => {
  res.render("success", { name: "Prejith" });
});
app.get("/users", (req, res) => {
  res.json({ users });
});*/

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});
/*
app.post("/contact", async (req, res) => {
  const { name, email } = req.body;
  await Entry.create({ name, email });
  res.redirect("/success");
});
*/
app.post("/login", async (req, res) => {
  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  }

  user = await User.create({
    name: req.body.name,
    email: req.body.email,
  });

  const token = jwt.sign({ _id: user._id }, "simplesecret");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("Server running at port 3000");
});
