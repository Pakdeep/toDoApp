const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema); //collection

const Eat = new Item({
  name: "Eat Food",
});
const Buy = new Item({
  name: "Buy Food",
});
const Cook = new Item({
  name: "Cook Food",
});
const itemsCollection = [Buy, Cook, Eat];
const listSchema = {
  name: String,
  coll: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/", function (req, res) {
  Item.find({}, function (err, items) {
    if (items.length === 0) {
      Item.insertMany(itemsCollection, function (err) {
        if (err) console.log(err);
        else console.log("Successfully inserted");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (!err) {
        foundList.coll.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});
app.post("/delete", function (req, res) {
  const delItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(delItemId, function (err) {
      if (err) console.log(err);
      else {
        console.log("deleted successfully!!!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { coll: { _id: delItemId } } },
      function (err, foundList) {
        if (!err) res.redirect("/" + listName);
      }
    );
  }
});
app.get("/:name", function (req, res) {//express routing
  const name = _.capitalize(req.params.name);
  List.findOne({ name: name }, function (err, foundList) {
    if (err) console.log(err);
    else {
      if (!foundList) {
        const list = new List({
          name: name,
          coll: itemsCollection,
        });
        list.save();
        res.redirect("/" + name);
      } else
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.coll,
        });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
