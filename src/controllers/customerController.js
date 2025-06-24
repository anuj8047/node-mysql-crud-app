const res = require("express/lib/response");
const multer = require('multer');
const path = require('path');
const controller = {};
const fs = require('fs');
// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage: storage });
controller.upload = upload;

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM customer', (err, customers) => {
            if (err) {
                res.json(err);
            }

            res.render('customers', {
                data: customers
            });
        });
    });
};

controller.save = (req, res) => {
    const data = req.body;
    const image = req.file ? req.file.filename : null;

    data.image = image; // Add image field to data

    req.getConnection((err, conn) => {
        if (err) return res.json(err);

        conn.query('INSERT INTO customer SET ?', [data], (err, customer) => {
            if (err) return res.json(err);

            res.redirect('/');
        });
    });
};


controller.delete = (req, res) => {
    const { id } = req.params;

    req.getConnection((err, conn) => {
        conn.query('DELETE FROM customer WHERE id = ?', [id], (err, rows) => {
            if (err) {
                res.json(err);
            }

            res.redirect('/');
        });
    });
};

controller.edit = (req, res) => {
    const { id } = req.params;

    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM customer WHERE id = ?', [id], (err, customer) => {
            if (err) {
                res.json(err);
            }
            
            res.render('customer_edit', {
                data: customer[0]
            });
        });
    });
};
controller.update = (req, res) => {
    const { id } = req.params;
    const newCustomer = req.body;

    // Use new uploaded image or keep old one
    const newImage = req.file ? req.file.filename : req.body.old_image;
    newCustomer.image = newImage;

    // Prevent old_image from being stored in DB
    delete newCustomer.old_image;

    req.getConnection((err, conn) => {
        if (err) return res.json(err);

        conn.query('UPDATE customer SET ? WHERE id = ?', [newCustomer, id], (err, rows) => {
            if (err) return res.json(err);

            // Optional: remove old image if replaced
            if (req.file && req.body.old_image) {
                const oldPath = path.join(__dirname, '../public/images/', req.body.old_image);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            res.redirect('/');
        });
    });
};



module.exports = controller;