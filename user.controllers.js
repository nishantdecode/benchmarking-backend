const { User } = require("./user.model");
const crypto = require('crypto');

class UserController {
  //@desc Register a user
  //@route POST /api/user/register
  //@access public
  register = async (req, res) => {
    const { firstName, lastName, password, email, role } = req.body;

    let uuid = crypto.randomUUID();

    console.log(User)

    const name = {
      first : firstName,
      last: lastName
    }

    const user = await User.create({
      name,
      loginID: uuid,
      password,
      email,
      role,
    });

    res.status(201).json({})
  };

  //@desc refresh access token
  //@route POST /api/user/refreshToken
  //@access private
  refreshToken = async (req, res) => {
    console.log("req received refresh");
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing header" });
    }

    const accessToken = req.headers['authorization'].split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({ error: "Missing access token" });
    }

    let decodedToken = User.schema.methods.verifyToken(accessToken);

    if(decodedToken instanceof Error){
      decodedToken = User.schema.methods.decodeToken(accessToken)
    };

    const user = await User.findOne({email: decodedToken.email});
    const refreshToken = user.refreshToken;
    if (!refreshToken) {
      res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'Lax' });
      return res.status(401).json({ error: "Invalid token!" });
    }

    const decodedRefreshToken = User.schema.methods.verifyRefreshToken(refreshToken);

    if(decodedRefreshToken instanceof Error){
      res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'Lax' });
      return res.status(401).json({ error: "Token Expired!" });
    };

    const newAccessToken = User.schema.methods.generateToken({name:user.name,email:user.email,role:user.role});
    console.log(newAccessToken)

    res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'Lax' });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    console.log('success')
    res.status(201).json({ success : 'Token refreshed!'});
  };

  //@desc Register a user
  //@route POST /api/user/verifyToken
  //@access private
  verifyToken = async (req, res) => {
    console.log("req received verify");
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing header" });
    }

    const accessToken = req.headers['authorization'].split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({ error: "Missing access token" });
    }

    try {
      const decodedToken = User.schema.methods.verifyToken(accessToken);

      if(decodedToken instanceof Error){
        return res.status(401).json({ error: "Invalid or expired token" });
      };

      const user = await User.findOne({email: decodedToken.email});
      const userObj = {
        name : user.name,
        role : user.role
      }
      console.log("success")
      res.status(200).json({userObj});
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  //@desc login user after email verification through OTP
  //@route POST /api/user/login
  //@access public
  login = async (req, res) => {
    console.log("Req Received login");
    const { loginID, password } = req.body;

    const user = await User.findOne({ loginID });
    if (!user || !user.schema.methods.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.clearCookie("token");
    await user.save();

    const accessToken = user.schema.methods.generateToken({name:user.name,email:user.email,role:user.role});
    const refreshToken = user.schema.methods.generateRefreshToken(user.loginID);

    user.refreshToken = refreshToken;
    await user.save();

    const oneDay = 24 * 60 * 60 * 1000;

    const expirationDate = new Date(Date.now() + 7 * oneDay);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "benchmarking-frontend.vercel.app",
      expires: expirationDate,
    });

    const userObj = {
      name: user.name,
      role: user.role,
    }
    console.log("success")
    res.status(201).json({ user: userObj });
  };
}

module.exports.UserController = new UserController();