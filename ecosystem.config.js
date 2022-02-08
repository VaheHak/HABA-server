module.exports = {
  apps : [{
    name: "haba",
    script: "./bin/index.js",
    watch: true,
    node_args: "-r dotenv/config",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production"
    },
    ignore_watch : ["node_modules", "public"],
  }]
};
