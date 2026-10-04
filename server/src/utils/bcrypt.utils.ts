import bcrypt from "bcryptjs";

export const hashPassword = async (password: string) => {
  try {
    // salt
    const salt = await bcrypt.genSalt(10);
    //hash
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const comparePassword = async (password: string, hash: string) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    throw err;
  }
};
