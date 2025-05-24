const express = require("express");
const adminRouter = express.Router();
const { z } = require("zod");
const bcrypt = require("bcrypt");
const { AdminModel } = require("../db");
const { CourseModel } = require("../db.js");
const jwt = require("jsonwebtoken");
const { JWT_ADMIN_SECRET } = require("../config");
const { admin_auth } = require("../middleware/admin");
//brcypt, zod, jsonwebtoken
adminRouter.post("/signup", async function (req, res) {
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

  const existingAdmin = await AdminModel.findOne({ email });
  if (existingAdmin) {
    return res.status(401).json({
      msg: "admin already exists",
    });
  }

  const hashedpswrd = await bcrypt.hash(password, 5);
  try {
    await AdminModel.create({
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

adminRouter.post("/login", async function (req, res) {
  const { email, password } = req.body;
  try {
    const admin = await AdminModel.findOne({ email }); // check if this user exists?
    if (!admin) {
      return res.status(403).json({
        msg: "user does not exists",
      });
    }
    const found = await bcrypt.compare(password, admin.password); //check if password is correct
    if (!found) {
      return res.status(403).json({
        msg: "incorrect credentials",
      });
    }
    const token = jwt.sign(
      {
        id: admin._id,
      },
      JWT_ADMIN_SECRET
    );
    return res.json({
      token,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "something went wrong",
    });
  }
});

adminRouter.post("/course", admin_auth, async function (req, res) {
  const adminId = req.adminId;
  const { title, description, price, imageUrl } = req.body;
  try {
    await CourseModel.create({
      title,
      description,
      price,
      imageUrl,
      creatorId: adminId,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "error coccured connecting to database",
    });
  }
  res.json({
    msg: "course added",
  });
});

adminRouter.delete("/course", admin_auth, async function (req, res) {});

adminRouter.put("/course", admin_auth, async function (req, res) {
  const adminId = req.adminId;
  const { title, description, price, imageUrl, courseId } = req.body;
  try {
    const data = await CourseModel.findOneAndUpdate(
      //update a parrticular course
      { _id: courseId, creatorId: adminId },
      { title, description, price, imageUrl },
      { new: true }
    );
    if (!data) {
      return res.status(403).json({
        msg: "unauthorized access",
      });
    }
    return res.json({
      msg: "course updated",
    });
  } catch (e) {
    res.status(500).json({
      msg: "error occured",
    });
  }
});

adminRouter.get("/course", admin_auth, async function (req, res) {
  //get all courses created by admin
  const creatorId = req.adminId;

  try {
    const courses = await CourseModel.find({
      //it returns array
      creatorId: creatorId,
    });
    if (courses.length == 0) {
      return res.json({
        msg: " no courses created by you",
      });
    }
    return res.json({
      courses: courses,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "some error occured",
    });
  }
});

module.exports = { adminRouter };
