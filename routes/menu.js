//import library
const express = require('express');
const bodyParser = require('body-parser');

const { isRole } = require("../auth")
const SECRET_KEY = "BelajarNodeJSItuMenyengankan"

//import multer
const multer = require("multer")
const path = require("path")
const fs = require("fs")

//implementasi library
const app = express();
const { Op } = require("sequelize")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//import model
const model = require('../models/index');
const menu = model.menu

//config storage gambar
const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,"./gambar/menu")
    },
    filename: (req,file,cb) => {
        cb(null, "img-" + Date.now() + path.extname(file.originalname))
    }
})
let upload = multer({storage: storage})

//endpoint menampilkan semua data menu, method: GET, function: findAll()
app.get("/", isRole(["admin"]), async (req,res) => {
    menu.findAll()
        .then(result => {
            res.json({
                menu : result,
                count : result.length
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

//menampilkan data menu berdasarkan id
app.get("/:id_menu", isRole(["admin"]), async (req, res) =>{
    menu.findOne({ where: {id_menu: req.params.id_menu}})
    .then(result => {
        res.json({
            menu: result
        })
    })
    .catch(error => {
        res.json({
            message: error.message
        })
    })
})

//endpoint untuk menyimpan data menu, METHOD: POST, function: create
app.post("/",  upload.single("gambar"), isRole(["admin"]), async (req,res) => {
    if (!req.file) {
        res.json({
            message: "No uploaded file"
        })
    } else {
    let data = {
        nama_menu : req.body.nama_menu,
        jenis : req.body.jenis,
        deskripsi : req.body.deskripsi,
        gambar : req.file.filename,
        harga : req.body.harga
    }

    menu.create(data)
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
    }
})

//endpoint mengupdate data menu, METHOD: PUT, function:update
app.put("/:id",  upload.single("gambar"), isRole(["admin"]), async (req,res) => {
    let param = {
        id_menu : req.params.id
    }
    let data = {
        nama_menu : req.body.nama_menu,
        jenis : req.body.jenis,
        deskripsi : req.body.deskripsi,
        gambar : req.file.filename,
        harga : req.body.harga
    }

    if (req.file) {
        // get data by id
        const row = menu.findOne({where: param})
        .then(result => {
            let oldFileName = result.gambar
           
            // delete old file
            let dir = path.join(__dirname,"../gambar/menu",oldFileName)
            fs.unlink(dir, err => console.log(err))
        })
        .catch(error => {
            console.log(error.message);
        })

        // set new filename
        data.gambar = req.file.filename
    }

    menu.update(data, {where: param})
        .then(result => {
            res.json({
                message: "data has been updated"
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

//menghapus data menu berdasarkan id
app.delete("/:id", isRole(["admin"]), async (req, res) =>{
    try {
        let param = { id_menu: req.params.id}
        let result = await menu.findOne({where: param})
        let oldFileName = result.gambar
           
        // delete old file
        let dir = path.join(__dirname,"../gambar/menu",oldFileName)
        fs.unlink(dir, err => console.log(err))

        // delete data
        menu.destroy({where: param})
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

    } catch (error) {
        res.json({
            message: error.message
        })
    }
})

//search menu
app.post("/search/:keyword", async (req, res) => {
    let keyword = req.params.keyword //keyword?
    let result = await menu.findAll({
        where: {
            [Op.or]: [
                {
                    id_menu: {
                        [Op.like]: `%${keyword}%`
                    }
                },
                {
                    nama_menu: {
                        [Op.like]: `%${keyword}%`
                    }
                },
                {
                    jenis: {
                        [Op.like]: `%${keyword}%`
                    }
                },
                {
                    deskripsi: {
                        [Op.like]: `%${keyword}%`
                    }
                },
                {
                    harga: {
                        [Op.like]: `%${keyword}%`
                    }
                },
            ]
        }
    })
    res.json({
        menu: result
    })
})

module.exports = app
