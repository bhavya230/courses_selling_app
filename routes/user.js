const express = require("express");
const { UserModel, PurchasesModel, CourseModel } = require("../db");
const userRouter = express.Router();
const { z } = require("zod");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_USER_SECRET } = require("../config");
const { user_auth } = require("../middleware/user");

userRouter.post("/signup", async function (req, res) {
  //schema validation
  const requiredBody = z.object({
    email: z.string().min(15).max(30).email(),
    password: z.string().min(8).max(20),
    firstName: z.string().min(3).max(10),
    lastName: z.string().min(3).max(20),
  });
  const parsedData = requiredBody.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(403).json({
      //incorrect input
      error: parsedData.error,
    });
  }
  const { email, password, firstName, lastName } = parsedData.data;

  const existingAdmin = await UserModel.findOne({ email });
  if (existingAdmin) {
    return res.status(401).json({
      msg: "user already exists",
    });
  }

  const hashedpswrd = await bcrypt.hash(password, 5);
  try {
    await UserModel.create({
      email,
      password: hashedpswrd,
      firstName,
      lastName,
    });
    res.json({
      msg: "you are signed up",
    });
  } catch (e) {
    res.status(403).json({
      msg: "error occured",
    });
  }
});

userRouter.post("/login", async function (req, res) {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email }); // check if this user exists?
    if (!user) {
      return res.status(403).json({
        msg: "user not found",
      });
    }
    const found = await bcrypt.compare(password, user.password); //check if password is correct
    if (!found) {
      return res.status(403).json({
        msg: "incorrect credentials",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
      },
      JWT_USER_SECRET
    );
    return res.json({
      token,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "error occured",
    });
  }
});

userRouter.get("/purchases", user_auth, async function (req, res) {
  const userId = req.userId;

  try {
    const purchases = await PurchasesModel.find({
      userId,
    });

    let purchasesIDs = [];

    for (let i = 0; i < purchases.length; i++) {
      purchasesIDs.push(purchases[i].courseId);
    }

    const courses = await CourseModel.find({
      _id: { $in: purchasesIDs },
    });
    return res.json({
      purchases,
      courses,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: " some error occured",
    });
  }
});

module.exports = { userRouter };
