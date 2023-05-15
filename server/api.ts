/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

import express from "express";

// import models so we can interact with the database

// import authentication library
import {Entry, RawEntry, TransactionLog} from "./log";
import { generateKeyPair } from "./vrf";
import { proposeTransaction } from "./chwazi";

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

const { genUserID } = require("./utils");

router.get("/whoami", (req, res) => {
  const user_id = genUserID();
  res.send({user_id})
})

router.post("/initsocket", (req, res) => {
  if(!req.body.user_id || !req.body.socket_id) {
    return;
  }
  console.log('initializing socket with user', req.body.user_id, req.body.socket_id)
  socketManager.addUser(req.body.user_id, socketManager.getSocketFromSocketID(req.body.socket_id));
});

router.post("/create", async (req, res) => {
  const chwazi_id = socketManager.createChwazi();
  await socketManager.joinChwazi(chwazi_id, req.body.user_id);
  res.send({ chwazi_id });
});

router.post("/join", async (req, res) => {
  console.log("before the joinChwazi")
  const success = await socketManager.joinChwazi(req.body.chwazi_id, req.body.user_id);
  res.send({ success });
})

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

const isPositiveInteger = (value: string): boolean => {
  return /\d+$/.test(value);
}

const log = new TransactionLog();
const keys = generateKeyPair();
router.post("/log/get/:index", async (req, res) => {
  const indexStr = req.params.index;
  if (!isPositiveInteger(indexStr)) {
    res.status(400).send({ msg: "invalid index" });
    return;
  }
  const index = parseInt(indexStr);

  if (index < log.size) {
    res.status(400).send( {msg: "index too large" });
    return;
  }

  res.send({ index });
})

type Phase1Request = {
  username: string,
  amount: number
}

type Phase1Response = {
  participants: Map<string, number>
}

router.post("/txn/phase1", (req, res) => {
  // TODO: should aggregate a bill for the given txn ID
})

type Phase2Request = {
  // TODO this should use the relevant state for an accepted or rejected request rather than re-sending participants.
  participants: Map<string, number>
}

type Phase2Response = {
  entry: RawEntry
}

router.post("/txn/phase2", (req, res) => {
  const body: Phase2Request = req.body;
  const participants = body.participants;
  if (participants === undefined) {
    res.status(400);
    return;
  }

  const entry = proposeTransaction({ participants }, keys.secretKey, log);

  const response: Phase2Response = { entry };
  res.send(response);
  return;
})

type Phase3Request = {
  transactionID: string,
  accepted: boolean,
}

type Phase3Response = {
  success: boolean
}

router.post("/txn/phase3", (req, res) => {
  // TODO: if all accept the transaction, commit it by adding it to the log!
})

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

export default router;
