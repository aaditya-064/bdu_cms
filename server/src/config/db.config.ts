import mongoose from "mongoose";

export const db = (DB_URI: string) => {
  mongoose
    .connect(DB_URI)
    .then(() => console.log("database connected"))
    .catch((err) => {
      console.log(err);
    });
};
