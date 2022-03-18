const bcrypt = require('bcrypt');
const userRepository = require('../dao/userDao');
const jwt = require('jsonwebtoken');

async function signIn(username, password) {
  const user = await userRepository.findByUsername(username);
  if (user.length === 0) {
    throw 'INVALID_USERNAME';
  }
    const result = await bcrypt.compare(password, user[0].password);
  if (!result) {
    throw 'INVALID_PASSWORD';
  }
  const userInfo = { id, username };
  const accessToken = jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
  userRepository.updateUserToken(user[0].id, accessToken);
  return accessToken;
}

module.exports = {
  signIn
}