//import auth
const auth = require("../auth")
const jwt = require("jsonwebtoken")
const SECRET_KEY = "BelajarNodeJSItuMenyengankan"
const { isRole } = require("../auth")

//import library
const express = require('express');
const bodyParser = require('body-parser');

//implementasi library
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//import model
const models = require("../models/index")
const meja = models.meja

//menampilkan semua data meja
app.get("/", isRole(["admin"]), (req, res) => {
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
app.get("/:id_meja", isRole(["admin"]), (req, res) =>{
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
app.post("/", isRole(["admin"]), (req, res) =>{ 
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
app.put("/:id", isRole(["admin"]), (req, res) =>{
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
app.delete("/:id", isRole(["admin"]), (req, res) =>{
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

module.exports = app
