module.exports = {
  apps : [{
    script    : "./src/index.js",
    instances : "max",
    exec_mode : "cluster",
    env: {
      "NODE_ENV": "production",
    },
  }]
};
