const { UserService } = require("../services/user.serivce");

const getUsers = async (req, res) => {  
  const { db } = req.app;

  const result = await UserService.getUsers(db);

  res.status(200).json(result);
};

const login = async (req, res) => {
  if (!req?.body?.email || !req?.body?.password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  const { email, password } = req.body;
  const { db } = req.app;

  const result = await UserService.login(email, password, db);

  res.status(200).json(result);
};

const register = (req, res) => {
  if (!req?.body?.email || !req?.body?.password || !req?.body?.firstName || !req?.body?.lastName) {
    return res.status(400).json({
      message: "Please provide email, password, firstName and lastName",
    });
  }

  if(!req?.body?.role){
    req.body.role = "admin";
  }

  const { db } = req.app;
  let result;
  try {
    result = UserService.register(req.body, db);  
  } catch (error) {    
    res.status(500).json({ error: error.message });
  } 
  res.status(201).json(result);
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ message: "Please provide refreshToken" });
  }

  const { db } = req.app;

  const result = await UserService.refreshToken(refreshToken, db);

  res.status(200).json(result);
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { db } = req.app;

  let result;
  try {
    result = await UserService.updateUser(id, req.body, db);    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

  res.status(200).json(result);
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { db } = req.app;  

  let result;
  try {
    result = UserService.deleteUser(id, db);    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

  res.status(200).json(result);
};



module.exports.UserController = { login, register, refreshToken, getUsers, updateUser, deleteUser };
