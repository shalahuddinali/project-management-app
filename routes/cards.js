const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const auth = require("../middleware/auth_Middleware");
const member = require("../middleware/user_Middleware");

const User = require("../models/User");
const Board = require("../models/Board");
const List = require("../models/List");
const Card = require("../models/Card");
let cors = require("cors");
let app = express();

app.use(cors());
// Add a card
router.post(
  "/",
  [auth, member, [check("title", "Title is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, listId } = req.body;
      const { startDate, endDate } = req.body;

      const boardId = req.header("boardId");

      // Create and save the card
      const newCard = new Card({ title, date: { startDate, endDate } });
      const card = await newCard.save();

      // Assign the card to the list
      const list = await List.findById(listId);
      list.cards.push(card);
      await list.save();

      res.json({ cardId: card.id, listId });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Get all of a list's cards
router.get("/listCards/:listId", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }

    const cards = [];
    for (const cardId of list.cards) {
      cards.push(await List.findById(cardId));
    }

    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get a card by id
router.get("/:id", auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }

    res.json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Edit a card's title, description or dates
router.patch("/edit/:id", [auth, member], async (req, res) => {
  try {
    const { title, description, label } = req.body;
    const { startDate, endDate } = req.body.date;

    if (title === "") {
      return res.status(400).json({ msg: "Title is required" });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }

    card.title = title ? title : card.title;
    if (description || description === "") {
      card.description = description;
      card.date.startDate = startDate;
      card.date.endDate = endDate;
    }
    if (startDate) {
      card.date.startDate = startDate;
      card.date.endDate = endDate;
    }
    if (label || label === "none") {
      card.label = label;
    }
    await card.save();

    res.json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Move a card
router.patch("/move/:id", [auth, member], async (req, res) => {
  try {
    const { fromId, toId, toIndex } = req.body;
    const boardId = req.header("boardId");

    const cardId = req.params.id;
    const from = await List.findById(fromId);
    let to = await List.findById(toId);
    if (!cardId || !from || !to) {
      return res.status(404).json({ msg: "List/card not found" });
    } else if (fromId === toId) {
      to = from;
    }

    const fromIndex = from.cards.indexOf(cardId);
    if (fromIndex !== -1) {
      from.cards.splice(fromIndex, 1);
      await from.save();
    }

    if (!to.cards.includes(cardId)) {
      if (toIndex === 0 || toIndex) {
        to.cards.splice(toIndex, 0, cardId);
      } else {
        to.cards.push(cardId);
      }
      await to.save();
    }

    res.send({ cardId, from, to });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add/Remove a member
router.put(
  "/addMember/:add/:cardId/:userId",
  [auth, member],
  async (req, res) => {
    try {
      const { cardId, userId } = req.params;
      const card = await Card.findById(cardId);
      const user = await User.findById(userId);
      if (!card || !user) {
        return res.status(404).json({ msg: "Card/user not found" });
      }

      const add = req.params.add === "true";
      const members = card.members.map((member) => member.user);
      const index = members.indexOf(userId);
      if ((add && members.includes(userId)) || (!add && index === -1)) {
        return res.json(card);
      }

      if (add) {
        card.members.push({ user: user.id, name: user.name });
      } else {
        card.members.splice(index, 1);
      }
      await card.save();

      await board.save();

      res.json(card);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Delete a card
router.delete("/:listId/:id", [auth, member], async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    const list = await List.findById(req.params.listId);
    if (!card || !list) {
      return res.status(404).json({ msg: "List/card not found" });
    }

    list.cards.splice(list.cards.indexOf(req.params.id), 1);
    await list.save();
    await card.remove();

    res.json(req.params.id);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
