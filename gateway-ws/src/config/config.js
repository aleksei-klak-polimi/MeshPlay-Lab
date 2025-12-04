const config = {
    port : process.env.PORT || 5001,
    env : process.env.NODE_ENV || 'dev',
    redisPrefix : process.env.REDIS_PREFIX || 'dev',
  };

export default config;