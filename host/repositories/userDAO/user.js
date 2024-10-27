import User from "../../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const loginUser = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const role = user.role;
        const token = jwt.sign({ _id: user._id, role }, process.env.SECRETKEY, {
          expiresIn: "12h",
        });

        return token;
      } else {
        throw new Error("Wrong password.");
      }
    } else {
      throw new Error("User not found.");
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUser = async (query) => {
  try {
    return await User.findOne(query);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUserById = async (id) => {
  try {
    const user = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classId",
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groupId",
          foreignField: "_id",
          as: "groupId",
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "groupId.projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $lookup: {
          from: "matcheds",
          localField: "groupId.matchedId",
          foreignField: "_id",
          as: "matched",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "matched.mentorId",
          foreignField: "_id",
          as: "mentor",
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "teacherId",
          as: "classList",
        },
      },
    ]);
    return user[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUserPassword = async (userId, newPassword) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
  } catch (error) {
    throw new Error(error.message);
  }
};

const changePassword = async (email, oldPassword, newPassword) => {
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found.");
    }

    // Check if the old password matches
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Old password is incorrect.");
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    return { message: "Password changed successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  loginUser,
  findUserByEmail,
  findUser,
  findUserById,
  updateUserPassword,
  changePassword,
};
