const jwt = require("jsonwebtoken")
const SECRET_KEY = "BelajarNodeJSItuMenyengankan"
auth = (req, res, next) => {
    let header = req.headers.authorization
    let token = header && header.split(" ")[1]

    let jwtHeader = {
        algorithm: "HS256"
    }
    if(token == null){
        res.status(401).json({ message: "Unauthorized"})
    }else{
        jwt.verify(token, SECRET_KEY, jwtHeader, (error,user) => {
            if (error) {
                res
                .status(401)
                .json({
                    message: "Invalid token"
                })
            } else {
                console.log(user);
                next()
            }
        })
    }
}

const isRole = (authRoles = []) => (req,res,next)=>{
    let token = req.headers.authorization.split(" ")[1]
    let decoded = jwt.verify(token, SECRET_KEY)
    if (authRoles.includes(decoded.role)) {
        next()
    } else {
        res.json({
            message: "You are not authorized to access this resource"
        })
    }
}

module.exports = {auth, isRole}
