//import express
const express = require("express")
const app = express()
const { Op } = require("sequelize"); // import operator sequelize
const { isRole } = require("../auth")

app.use(express.json())
//import model
const models = require("../models/index")
const transaksi = models.transaksi
const detail_transaksi = models.detail_transaksi
const user = models.user
const meja = models.meja
const menu = models.menu

//untuk menampilkan data detail transaksi
app.get("/detail", isRole(["kasir", "manajer"]), async (req, res) =>{
  let result = await detail_transaksi.findAll({
      include: 
          ["transaksi","menu"]
  })
  res.json({
      detail_transaksi: result,
      count : result.length
  })
})

//untuk menampilkan data detail transaksi berdasarkan id detail transaksi
app.get("/detail/:id", isRole(["kasir", "manajer"]), async (req, res) =>{
  let param = { id: req.params.id}
  let result = await detail_transaksi.findOne({
      where: param,
      include: [
          "transaksi","menu"
      ]
  })
  res.json(result)
})

//Endpoint untuk menampilkan semua data transaksi
app.get("/", isRole(["kasir", "manajer"]), async (req, res) =>{
    let result = await transaksi.findAll({
        include: [
            "user","meja",
            {
                model: models.detail_transaksi,
                as : "detail_transaksi",
                include: ["menu"]
            }
        ]
    })
    res.json({
        transaksi: result,
        count : result.length
    })
})

//endpoint untuk menampilkan data transaksi berdasarkan id
app.get("/:id_transaksi", isRole(["kasir", "manajer"]), async (req, res) =>{
    let param = { id_transaksi: req.params.id_transaksi}
    let result = await transaksi.findOne({
        where: param,
        include: [
            "user","meja",
            {
                model: models.detail_transaksi,
                as : "detail_transaksi",
                include: ["menu"]
            }
        ]
    })
    res.json(result)
})

//endpoint untuk menampilkan data transaksi berdasarkan id user
app.get("/byId/:id_user", isRole(["kasir", "manajer"]), async (req, res) =>{
    let param = { id_user: req.params.id_user}
    let result = await transaksi.findAll({
        where: param,
        order: [
            ["id_transaksi", "DESC"],
            ["tgl_transaksi", "DESC"],
          ],
        include: [
            "user","meja",
            {
                model: models.detail_transaksi,
                as : "detail_transaksi",
                include: ["menu"]
            }
        ]
    })
    res.json(result)
})

// endpoint untuk menambahkan data transaksi baru
app.post("/", isRole(["kasir"]), async (req, res) => {
  try {
    let current = new Date().toISOString().split("T")[0];
    let data = {
      id_user: req.body.id_user,
      tgl_transaksi: current,
      id_meja: req.body.id_meja,
      nama_pelanggan: req.body.nama_pelanggan,
      status: "belum_bayar", //hardcode belum bayar
    };

    // Periksa apakah meja tersedia atau tidak
    let mejaData = await meja.findOne({
        where: { id_meja: req.body.id_meja, status: "tersedia" },
    });
    if (!mejaData) {
        return res.json({
            message: "Meja tidak tersedia",
        });
    }
  
    let listMenu = req.body.listMenu;
    let result = {};

    let insertTransaksi = await transaksi.create(data);
    result = insertTransaksi.dataValues;
    result.detail = [];
    result.total = 0;

    for (let i = 0; i < listMenu.length; i++) {
      let param = { id_menu: listMenu[i]["id_menu"] };
      let getMenu = await menu.findOne({ where: param });

      // detailItem = req.body.detail_transaksi
      let detailItem = {
        id_transaksi: insertTransaksi.id_transaksi,
        id_menu: listMenu[i]["id_menu"],
        qty: listMenu[i]["qty"],
        subtotal: listMenu[i]["qty"] * getMenu.harga,
      };

      let insertDetail = await detail_transaksi.create(detailItem);
      result.detail.push(insertDetail.dataValues);
      result.total += detailItem.subtotal;
    }

    let payloadUpdateStatus = {
      status: "tidak tersedia",
    };

    let payloadUpdateTransaksi = {
      total: result.total,
    };

    await transaksi.update(payloadUpdateTransaksi, {
      where: { id_transaksi: insertTransaksi.id_transaksi },
    });
    await meja.update(payloadUpdateStatus, {
      where: { id_meja: data.id_meja },
    });

    return res.status(200).json({
      massage: "data has been inserted",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      massage: "Internal server error",
      err: error,
    });
  }
});


// endpoint update data transaksi
app.put("/updatePemesanan/:id_transaksi", isRole(["kasir"]), async (req, res) => {
  const param = { id_transaksi: req.params.id_transaksi }; // inisialisasi parameter yang akan dikirimkan melalui parameter

  const listOrder = req.body.listMenu; // inisialisasi parameter yang akan dikirimkan melalui body

  // find all data detail transaksi dimana id_transaksi sesuai params
  let detail = await detail_transaksi.findAll({
    where: param,
    include: ["menu"],
  });

  // ini deklarasi variabel array untuk save data
  let dataRecent = [];
  let payloadUpdate = [];
  let addDetail = [];

  // Looping for check
  for (let i = 0; i < listOrder.length; i++) {
    // check if di detail ada id menu yang sama dengan id di payload listOrder
    const find = detail.find(
      (x) => x.dataValues.id_menu === listOrder[i].id_menu
    );

    // Jika ada
    if (find) {
      dataRecent.push(find.dataValues); // simpan data yang ada di detail
      payloadUpdate.push(listOrder[i]); // simpan data yang ada di payload
    } else {
      // Jika tidak
      addDetail.push(listOrder[i]); // simpan data payload di addDetail
    }
  }

  // LOOPING UPDATE QTY
  for (let i = 0; i < dataRecent.length; i++) {
    let getMenu = await menu.findOne({
      where: { id_menu: payloadUpdate[i].id_menu },
    });
    let payloadQty = {
      qty: payloadUpdate[i].qty,
      subtotal: payloadUpdate[i].qty * getMenu.harga,
    };

    await detail_transaksi.update(payloadQty, {
      where: { id: dataRecent[i].id },
    });
  }

  // INSERT NEW DETAIL
  for (let i = 0; i < addDetail.length; i++) {
    let getMenu = await menu.findOne({
      where: { id_menu: addDetail[i].id_menu },
    });

    let detailItem = {
      id_transaksi: req.params.id_transaksi,
      id_menu: addDetail[i].id_menu,
      qty: addDetail[i].qty,
      subtotal: addDetail[i].qty * getMenu.harga,
    };

    await detail_transaksi.create(detailItem);
  }

  let alldetail = await detail_transaksi.findAll({
    where: param,
  });

  let total = 0;

  for (let i = 0; i < alldetail.length; i++) {
    total += alldetail[i].dataValues.subtotal;
  }

  let payloadTotal = {
    total: total,
  };

  await transaksi.update(payloadTotal, {
    where: param,
  });

  res.status(200).json({
    status: "success update order",
  });
});

//endpoint update bayar transaksi
app.put("/updatePembayaran/:id_transaksi", isRole(["kasir"]), async (req, res) => {
  const param = { id_transaksi: req.params.id_transaksi };
  console.log(param)
  
  transaksi
    .update({ status: `lunas` }, { where: param })
    .then(async (result) => {
      let dataTransaksi = await transaksi.findOne({
        where: { id_transaksi: req.params.id_transaksi },
      });

      let idMeja = dataTransaksi.id_meja
      await meja.update(
        { status: "tersedia" },
        { where: { id_meja: idMeja} }
      ); 
      res.status(200).json({
        status: "success",
        message: "data berhasil diubah",
      }); 
    })
    .catch((error) => {
      // jika gagal
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

// endpoint untuk menghapus data transaksi
app.delete("/:id_transaksi", isRole(["kasir"]), async (req, res) =>{
    let param = { id_transaksi: req.params.id_transaksi}
    try {
        await detail_transaksi.destroy({where: param})
        await transaksi.destroy({where: param})
        res.json({
            message : "data has been deleted"
        })
    } catch (error) {
        res.json({
            message: error
        })
    }
})

// filtering transaksi berdasarkan tgl_transaksi
app.get("/filter/tgl_transaksi/:tgl_transaksi", isRole(["manajer"]), async (req, res) => { // endpoint untuk mencari data transaksi berdasarkan tanggal transaksi
    const param = { tgl_transaksi: req.params.tgl_transaksi }; // inisialisasi parameter yang akan dikirimkan melalui parameter
  
    transaksi
     .findAll({ // mengambil data transaksi berdasarkan tanggal transaksi yang dikirimkan melalui parameter
        where: {
          tgl_transaksi: {
            [Op.between]: [
              param.tgl_transaksi + " 00:00:00",
              param.tgl_transaksi + " 23:59:59",
            ], // mencari data transaksi berdasarkan tanggal transaksi yang dikirimkan melalui parameter
          }
        },
        include: [ // join tabel user dan meja
          {
            model: user,
            as: "user",
          },
          {
            model: models.meja,
            as: "meja",
          },
        ],
      })
      .then((result) => { // jika berhasil
        if (result.length === 0) { // jika data tidak ditemukan
          res.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
            status: "error",
            message: "data tidak ditemukan",
          });
        } else { // jika data ditemukan
          res.status(200).json({ // mengembalikan response dengan status code 200 dan pesan data ditemukan
            status: "success",
            message: "data ditemukan",
            data: result,
          });
        }
      })
      .catch((error) => { // jika gagal
        res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
          status: "error",
          message: error.message,
        });
      });
  });
  
  // filtering transaksi berdasarkan nama_user dari tabel user
  app.get("/filter/nama_user/:nama_user", isRole(["manajer"]), async (req, res) => { // endpoint untuk mencari data transaksi berdasarkan nama user
    const param = { nama_user: req.params.nama_user }; // inisialisasi parameter yang akan dikirimkan melalui parameter
  
    user
      .findAll({ // mengambil data user berdasarkan nama user yang dikirimkan melalui parameter
        where: {
          nama_user: param.nama_user,
        },
      })
      .then((result) => { // jika berhasil
        if (result == null) { // jika data tidak ditemukan
          res.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
            status: "error",
            message: "data tidak ditemukan",
          });
        } else { // jika data ditemukan
          transaksi
            .findAll({ // mengambil data transaksi berdasarkan id user yang dikirimkan melalui parameter
              where: {
                id_user: result[0].id_user,
              },
            })
            .then((result) => { // jika berhasil
             if (result.length === 0) { // jika data tidak ditemukan
                res.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
                  status: "error",
                  message: "data tidak ditemukan",
                });
              } else { // jika data ditemukan
                res.status(200).json({ // mengembalikan response dengan status code 200 dan pesan data ditemukan
                  status: "success",
                  message: "data ditemukan",
                  data: result,
                });
              }
            })
            .catch((error) => { // jika gagal
              res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
                status: "error",
                message: error.message,
              });
            });
        }
      })
      .catch((error) => { // jika gagal
        res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
          status: "error",
          message: error.message,
        });
      });
  });

module.exports = app
