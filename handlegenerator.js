let jwt = require("jsonwebtoken");
let Crypto = require("simple-crypto-js").default;
const MongoClient = require("mongodb").MongoClient;

require("dotenv").config();

const secret = process.env.SECRET;

/**
 * Creacion de TOKEN
 */
class HandlerGenerator {
  /**
   *
   * @param {*} req
   * @param {*} res
   */
  index(req, res) {
    // Retorna una respuesta exitosa con previa validación del token
    const username = req.decoded.username;
    const role = req.decoded.role;

    if (role === "admin") {
      // Conexion a MongoDB
      const conn = MongoClient.connect("mongodb://localhost:27017/", {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      conn.then(client => {
        client
          .db("User")
          .collection("users")
          .insertOne({ username: "nuevo", password: "nuevo", role: "anon" });

        client
          .db("User")
          .collection("users")
          .find({})
          .toArray((err, result) => {
            const tam = result.length;
            res.json({
              success: true,
              message: `Username: ${username}. Admin agrega un nuevo usuario a la DB. Hay ${tam} elementos`
            });
          });
      });
    } else {
      // Conexion a MongoDB
      const conn = MongoClient.connect("mongodb://localhost:27017/", {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      conn.then(client => {
        client
          .db("User")
          .collection("users")
          .find({})
          .toArray((err, result) => {
            const tam = result.length;
            res.json({
              success: true,
              message: `Username: ${username}. Index page for ${role}. Hay ${tam} elementos`
            });
          });
      });
    }
  }

  /**
   *
   */
  login = (req, res) => {
    // Extrae el usuario y la contraseña especificados en el cuerpo de la solicitud
    const username = req.body.username;
    const password = req.body.password;

    // Conexion a MongoDB
    const conn = MongoClient.connect("mongodb://localhost:27017/", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    conn.then(client => {
      const simpleCrypto = new Crypto(secret);

      //this.remove_all(client);

      //  this.insert_all(
      //   client,
      //   this.generator(client, username, password, simpleCrypto, req, res)
      // );

      /**
       * * Comentar siguiente linea si se utiliza la function insert_all anterior
       */
      this.generator(client, username, password, simpleCrypto, req, res);
    });

    conn.catch(err => console.log(err.message, "error connection"));
  };

  /**
   *
   */
  generator = (client, username, password, simpleCrypto, req, res) => {
    /**
     * Busca al usuario que se intenta loggear en la DB
     */
    client
      .db("User")
      .collection("users")
      .find({ username: username })
      .toArray((err, result) => {
        if (err) {
          console.log("Error al buscar a un susario por username", err.message);
          return;
        }

        const user = result[0];

        if (user && username && password) {
          const mockedPassword = simpleCrypto.decrypt(user.password); // decrypta la contrasena guardada en DB
          const mockedUsername = user.username;

          if (username === mockedUsername && password === mockedPassword) {
            /**
             * * Se genera un nuevo token para el nombre de usuario el cuál expira en 24 horas
             */
            const token = jwt.sign(
              { username: username, role: user.role },
              secret,
              {
                expiresIn: "24h"
              }
            );

            // Retorna el token el cuál debe ser usado durante las siguientes solicitudes
            res.json({
              success: true,
              message: "Authentication successful!",
              token: token
            });
          } else {
            // El error 403 corresponde a Forbidden (Prohibido) de acuerdo al estándar HTTP
            res.send(403).json({
              success: false,
              message: "Incorrect username or password"
            });
          }
        } else {
          // El error 400 corresponde a Bad Request de acuerdo al estándar HTTP
          res.send(400).json({
            success: false,
            message: "Authentication failed! Please check the request"
          });
        }
      });
  };

  /**
   * Borra todos los documentos de la coleccion
   */
  remove_all = client => {
    client
      .db("User")
      .collection("users")
      .remove({});
  };

  /**
   * Insert 3 usuarios y luego sigue con el Handle Generator
   */
  insert_all = (client, next) => {
    client
      .db("User")
      .collection("users")
      .insertMany([
        {
          username: "admin",
          role: "admin",
          password: simpleCrypto.encrypt("password")
        },
        {
          username: "user",
          role: "user",
          password: simpleCrypto.encrypt("password")
        },
        {
          username: "anon",
          role: "anon",
          password: simpleCrypto.encrypt("password")
        }
      ])
      .catch(err => console.log("Error en Insert Many", err.message))
      .then(_ => next());
  };
}

module.exports = HandlerGenerator;
