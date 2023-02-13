// //import auth
// const auth = require("../auth")
// const jwt = require("jsonwebtoken")
// const SECRET_KEY = "BelajarNodeJSItuMenyengankan"

//import express
const express = require("express")
const app = express()
app.use(express.json())

// import md5
const md5 = require("md5")

//import model
const models = require("../models/index")
const meja = models.meja

//menampilkan semua data meja
app.get("/", (req, res) =>{
    meja.findAll()
        .then(result => {
            res.json({
                meja: result,
                count : result.length
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })  
})

//menampilkan data meja berdasarkan id
app.get("/:id_meja", (req, res) =>{
    meja.findOne({ where: {id_meja: req.params.id_meja}})
    .then(result => {
        res.json({
            meja: result
        })
    })
    .catch(error => {
        res.json({
            message: error.message
        })
    })
})

//menambahkan data meja baru
app.post("/",(req, res) =>{ 
        let data = {
            nomor_meja : req.body.nomor_meja,
            status : req.body.status
        }
        meja.create(data)
        .then(result => {
            res.json({
                message: "data has been inserted"
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

//mengubah data meja berdasarkan id
app.put("/:id", (req, res) =>{
    let param = { id_meja: req.params.id}
    let data = {
        nomor_meja : req.body.nomor_meja,
        status : req.body.status
    }

    meja.update(data, {where: param})
        .then(result => {
            res.json({
                message: "data has been updated",
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

//menghapus data meja berdasarkan id
app.delete("/:id", async (req, res) =>{
        let param = { id_meja: req.params.id}
        // delete data
        meja.destroy({where: param})
        .then(result => {
           
            res.json({
                message: "data has been deleted",
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

// //login
// app.post("/auth", async (req,res) => {
//     let data= {
//         nama: req.body.nama,
//         tlp: req.body.tlp                 
//     }

//     let result = await meja.findOne({where: data})
//     if(result){
//         let payload = JSON.stringify(result)
//         // generate token
//         let token = jwt.sign(payload, SECRET_KEY)
//         res.json({
//             logged: true,
//             data: result,
//             token: token
//         })
//     }else{
//         res.json({
//             logged: false,
//             message: "Invalid username or password"
//         })
//     }
// })

module.exports = app