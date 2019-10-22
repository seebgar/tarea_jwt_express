let jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.SECRET;

/**
 * Función encargada de realizar la validación del token y que es directamente consumida por server.js
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
let checkToken = (req, res, next) => {
  let token = req.headers.authorization || req.headers["x-access-token"];

  if (token) {
    // Si el token incluye el prefijo 'Bearer ', este debe ser removido
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
      /**
       * * Llama la función verify del paquete jsonwebtoken que se encarga de realizar la validación del token con el secret proporcionado
       */
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          return res.json({
            success: false,
            message: "Token is not valid"
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.json({
        message: "Token no empieza con <Bearer >"
      });
    }
  } else {
    return res.json({
      success: false,
      message: "Auth token is not supplied"
    });
  }
};

module.exports = {
  checkToken: checkToken
};
