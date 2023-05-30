require("dotenv").config();
import { setupDB } from "./db";
import { log } from "./libraries/Log";

function seed(): PromiseLike<any> {
  // Do your seed code here, should return a promise that resolves whenn you are done.
  return Promise.resolve(true);
}

setupDB()
  .then(() => {
    return seed();
  })
  .then(() => {
    log.info("SEED DONE");
    process.exit();
  })
  .catch(err => {
    log.error("ERROR EXECUTING SEED:", err);
    process.exit();
  });
