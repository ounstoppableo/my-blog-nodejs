const getEnv = () => {
  return JSON.stringify(process.env.NODE_ENV).split('"')[1].trim();
};
module.exports = getEnv;
