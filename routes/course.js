const express = require("express");
const courseRouter = express.Router();
const { user_auth } = require("../middleware/user");
const { CourseModel } = require("../db");
const { PurchasesModel } = require("../db");

courseRouter.post("/purchase", user_auth, async function (req, res) {
  //to buy a course by user
  const userId = req.userId;
  const courseId = req.body.courseId;

  try {
    const course = await CourseModel.findOne({
      _id: courseId,
    });
    if (!course) {
      return res.status(400).json({
        msg: "course is not available",
      });
    }
    await PurchasesModel.create({
      courseId: courseId,
      userId,
    });
    res.json({
      msg: "you bought a course",
    });
  } catch (e) {
    console.log(e);
    res.json({ msg: "internal err" });
  }
});

courseRouter.get("/preview", async function (req, res) {
  //see all courses available
  const courses = await CourseModel.find();
  res.json({
    courses,
  });
});

module.exports = { courseRouter };
