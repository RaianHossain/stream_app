const bcrypt = require("bcrypt");
const getNewTokens = require("../util/getNewTokens");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const getUsers = async (db) => {
  const users = db.get("users").value();

  if (users == null || users == undefined || users.length == 0) {
    return res.status(404).send({ message: "No posts found" });
  }
  const filteredUsers = users.map(({ password, ...rest }) => rest);
  return filteredUsers;
}

const login = async (email, password, db) => {  
  let user;
  if(email === process.env.USER_NAME || email === process.env.USER_EMAIL) {
    user = {
      email: process.env.USER_EMAIL, 
      password: process.env.USER_PASSWORD,
      role: process.env.USER_ROLE,
      firstName: process.env.USER_FIRSTNAME,
      lastName: process.env.USER_LASTNAME,
      id: process.env.USER_ID
    };
  } else {
    user = db.get("users").find({ email }).value()
  }

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordCorrect = await bcrypt.compareSync(password, user.password);

  if (!isPasswordCorrect) {
    throw new Error("Invalid password");
  }

  const token = getNewTokens(user);

  let userObj = Object.assign({}, user);
  delete userObj.password;

  return {
    user: userObj,
    token,
  };
};

const register = (reqBody, db) => {
 
    const { email, password, firstName, lastName, role } = reqBody;

    const user = db.get("users").find({ email }).value();

    if (user) {
      throw new Error("User already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    const newUser = {
      id: crypto.randomUUID({ disableEntropyCache: true }),
      password: hashedPassword,
      firstName,
      lastName,
      avatar: null,
      email,
      role
    };

    db.get("users").push(newUser).write();
  
  

  // const token = getNewTokens(newUser);

  delete newUser.password;

  return {
    user: newUser,
    // token,
  };
};

const refreshToken = async (refreshToken, db) => {
  // check if refresh token valid
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

  if (!decoded) {
    throw new Error("Invalid refresh token");
  }

  // check if user exists
  const user = db.get("users").find({ id: decoded.id }).value();

  if (!user) {
    throw new Error("User not found");
  }

  const token = getNewTokens(user);

  return token;
};

const updateUser = (id, reqBody, db) => {
  const { firstName, lastName, email, role } = reqBody;
  const user = db.get("users").find({ id }).value();

  if (!user) {
    throw new Error("User not found");
  }

  const userWithEmail = db.get("users").find({ email }).value();

  if (userWithEmail) {
    throw new Error("Email Already Exists");
  }

  const updatedUser = {
    ...user,
    firstName,
    lastName,
    email,
    role
  };

  db.get("users").find({ id }).assign(updatedUser).write();

  return updatedUser;
}

const deleteUser = (id, db) => {
  const user = db.get("users").find({ id }).value();

  if (!user) {
    throw new Error("User not found");
  } 

  db.get("users").remove({ id }).write();
}

module.exports.UserService = {
  login,
  register,
  refreshToken,
  getUsers,
  updateUser,
  deleteUser
};
