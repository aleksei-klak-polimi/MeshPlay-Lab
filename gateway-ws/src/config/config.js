const config = {
    port : process.env.PORT || 5001,
    redisPrefix : process.env.REDIS_PREFIX || 'dev',
  };

export default config;